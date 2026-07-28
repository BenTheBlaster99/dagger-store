import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const productId = String(body.product_id || '')
    const quantity = Number(body.quantity || 0)
    const size = body.size ? String(body.size) : null
    const color = body.color ? String(body.color) : null

    if (!productId || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data: variants, error } = await supabase
      .from('product_variant')
      .select('*')
      .eq('product_id', productId)

    if (error) throw error

    const match = (variants || []).find((v) => {
      const sizeOk = !size || !v.size || v.size === size
      const colorOk =
        !color || !v.color || String(v.color).toLowerCase() === color.toLowerCase()
      return sizeOk && colorOk && Number(v.stock || 0) > 0
    })

    if (!match) {
      return NextResponse.json({ skipped: true, reason: 'No matching variant' })
    }

    const nextStock = Math.max(0, Number(match.stock || 0) - quantity)
    const { error: updateError } = await supabase
      .from('product_variant')
      .update({ stock: nextStock })
      .eq('id', match.id)

    if (updateError) throw updateError

    const remaining = (variants || []).reduce((sum, v) => {
      if (v.id === match.id) return sum + nextStock
      return sum + Number(v.stock || 0)
    }, 0)

    if (remaining <= 0) {
      await supabase
        .from('Products')
        .update({ sold_out: true, updated_at: new Date().toISOString() })
        .eq('id', productId)
    }

    return NextResponse.json({ success: true, nextStock, remaining })
  } catch (error) {
    console.error('adjust-stock error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Stock update failed' },
      { status: 500 }
    )
  }
}
