export const PROMO_HOURS = 3
export const PROMO_MS = PROMO_HOURS * 60 * 60 * 1000

export type PromoRow = {
  code: string | null
  discount_da: number | null
  expires_at: string | null
  updated_at?: string | null
}

export function normalizePromoCode(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, '')
}

export function isPromoLive(row: PromoRow | null | undefined, now = Date.now()) {
  if (!row?.code || !row.discount_da || !row.expires_at) return false
  const expires = new Date(row.expires_at).getTime()
  return Number.isFinite(expires) && expires > now
}

export function promoPayload(row: PromoRow | null | undefined) {
  const live = isPromoLive(row)
  return {
    code: live ? row!.code : null,
    discountDa: live ? Number(row!.discount_da) : null,
    expiresAt: row?.expires_at || null,
    active: live,
    updatedAt: row?.updated_at || null,
  }
}

export function promoOff(goods: number, discountDa: number) {
  const off = Math.max(0, Math.round(discountDa))
  return Math.min(off, Math.max(0, goods))
}
