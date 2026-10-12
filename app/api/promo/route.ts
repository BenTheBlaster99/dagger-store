import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { isPromoLive, normalizePromoCode, type PromoRow } from '@/lib/promo'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const code = normalizePromoCode(String(body.code || ''))
    if (!code) {
      return NextResponse.json({ valid: false, error: 'Enter a code' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('store_promo')
      .select('code, discount_da, expires_at')
      .eq('id', 1)
      .maybeSingle()
    if (error) throw error

    const row = data as PromoRow | null
    if (!row || !isPromoLive(row) || normalizePromoCode(row.code || '') !== code) {
      return NextResponse.json({ valid: false, error: 'Code expired or not valid' })
    }

    return NextResponse.json({
      valid: true,
      code: row.code,
      discountDa: Number(row.discount_da),
      expiresAt: row.expires_at,
    })
  } catch (error) {
    return NextResponse.json(
      { valid: false, error: error instanceof Error ? error.message : 'Could not check code' },
      { status: 500 }
    )
  }
}
