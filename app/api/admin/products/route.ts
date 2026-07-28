import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data: products, error } = await supabase
      .from('Products')
      .select('*, product_variant(*)')
      .order('name', { ascending: true })

    if (error) throw error
    return NextResponse.json({ products: products || [] })
  } catch (error) {
    console.error('admin products GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load products' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
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
    const { data: product, error } = await supabase
      .from('Products')
      .insert({
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
      .select()
      .single()

    if (error) throw error

    const variants = Array.isArray(body.variants) ? body.variants : []
    if (variants.length > 0) {
      const rows = variants
        .map((v: { size?: string; color?: string; stock?: number }) => ({
          product_id: product.id,
          size: v.size ? String(v.size).trim() : null,
          color: v.color ? String(v.color).trim() : null,
          stock: Number(v.stock || 0),
          price: null,
        }))
        .filter((v: { size: string | null; color: string | null }) => v.size || v.color)

      if (rows.length > 0) {
        const { error: variantError } = await supabase.from('product_variant').insert(rows)
        if (variantError) throw variantError
      }
    }

    const { data: full, error: reloadError } = await supabase
      .from('Products')
      .select('*, product_variant(*)')
      .eq('id', product.id)
      .single()

    if (reloadError) throw reloadError
    return NextResponse.json({ product: full })
  } catch (error) {
    console.error('admin products POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create product' },
      { status: 500 }
    )
  }
}
