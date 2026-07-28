import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('Products')
      .select('*, product_variant(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    return NextResponse.json({ product: data })
  } catch (error) {
    console.error('admin product GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load product' },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const body = await req.json()
    const name = String(body.name || '').trim()
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const basePrice = Number(body.base_price)
    if (!basePrice || basePrice <= 0) {
      return NextResponse.json({ error: 'Valid base price is required' }, { status: 400 })
    }

    const couponRaw = body.coupon_price
    const couponPrice =
      couponRaw === '' || couponRaw === null || couponRaw === undefined
        ? null
        : Number(couponRaw)

    const images = Array.isArray(body.images)
      ? body.images.map((img: string) => String(img).trim()).filter(Boolean)
      : String(body.images_text || '')
          .split('\n')
          .map((s: string) => s.trim())
          .filter(Boolean)

    const supabase = getSupabaseAdmin()
    const { error: updateError } = await supabase
      .from('Products')
      .update({
        name,
        description: body.description ? String(body.description).trim() : null,
        category: body.category ? String(body.category).trim() : null,
        base_price: basePrice,
        coupon_price: couponPrice !== null && !Number.isNaN(couponPrice) ? couponPrice : null,
        images,
        sold_out: Boolean(body.sold_out),
        is_active: body.is_active === false ? false : true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) throw updateError

    // Replace variants when provided
    if (Array.isArray(body.variants)) {
      const { error: deleteError } = await supabase
        .from('product_variant')
        .delete()
        .eq('product_id', id)

      if (deleteError) throw deleteError

      const rows = body.variants
        .map((v: { size?: string; color?: string; stock?: number }) => ({
          product_id: id,
          size: v.size ? String(v.size).trim() : null,
          color: v.color ? String(v.color).trim() : null,
          stock: Number(v.stock || 0),
          price: null,
        }))
        .filter((v: { size: string | null; color: string | null }) => v.size || v.color)

      if (rows.length > 0) {
        const { error: insertError } = await supabase.from('product_variant').insert(rows)
        if (insertError) throw insertError
      }
    }

    const { data, error } = await supabase
      .from('Products')
      .select('*, product_variant(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    return NextResponse.json({ product: data })
  } catch (error) {
    console.error('admin product PUT error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const supabase = getSupabaseAdmin()

    const { error: variantError } = await supabase
      .from('product_variant')
      .delete()
      .eq('product_id', id)

    if (variantError) throw variantError

    const { error } = await supabase.from('Products').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('admin product DELETE error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete product' },
      { status: 500 }
    )
  }
}
