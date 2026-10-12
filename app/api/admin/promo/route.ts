import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { PROMO_MS, normalizePromoCode, promoPayload, type PromoRow } from '@/lib/promo'

async function readPromo() {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('store_promo')
    .select('code, discount_da, expires_at, updated_at')
    .eq('id', 1)
    .maybeSingle()
  if (error) throw error
  return (data || null) as PromoRow | null
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const row = await readPromo()
    return NextResponse.json(promoPayload(row))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load promo' },
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
    const action = String(body.action || 'set')
    const supabase = getSupabaseAdmin()
    const expiresAt = new Date(Date.now() + PROMO_MS).toISOString()

    if (action === 'clear') {
      const { error } = await supabase
        .from('store_promo')
        .update({
          code: null,
          discount_da: null,
          expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1)
      if (error) throw error
      return NextResponse.json(promoPayload(await readPromo()))
    }

    if (action === 'refresh') {
      const current = await readPromo()
      if (!current?.code || !current.discount_da) {
        return NextResponse.json({ error: 'Set a code before refreshing it' }, { status: 400 })
      }
      const { error } = await supabase
        .from('store_promo')
        .update({ expires_at: expiresAt, updated_at: new Date().toISOString() })
        .eq('id', 1)
      if (error) throw error
      return NextResponse.json(promoPayload(await readPromo()))
    }

    const code = normalizePromoCode(String(body.code || ''))
    const discountDa = Number(body.discount_da)
    if (!/^[A-Z0-9]{3,16}$/.test(code)) {
      return NextResponse.json(
        { error: 'Code must be 3–16 letters or numbers' },
        { status: 400 }
      )
    }
    if (!Number.isInteger(discountDa) || discountDa < 1 || discountDa > 100000) {
      return NextResponse.json({ error: 'Discount must be a price in DA' }, { status: 400 })
    }

    const { error } = await supabase.from('store_promo').upsert({
      id: 1,
      code,
      discount_da: discountDa,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    if (error) throw error
    return NextResponse.json(promoPayload(await readPromo()))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save promo' },
      { status: 500 }
    )
  }
}
