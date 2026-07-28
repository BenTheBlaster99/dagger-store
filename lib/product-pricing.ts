export type ProductRecord = {
  id: string
  name: string
  description?: string | null
  category?: string | null
  base_price: number | string | null
  coupon_price?: number | string | null
  images?: string[] | null
  sold_out?: boolean | null
  is_active?: boolean | null
}

export type VariantRecord = {
  id?: string
  product_id?: string
  size?: string | null
  color?: string | null
  stock?: number | null
  price?: number | string | null
}

export function getProductPricing(product: ProductRecord) {
  const base = Number(product.base_price || 0)
  const saleRaw = product.coupon_price
  const sale =
    saleRaw === null || saleRaw === undefined || saleRaw === ''
      ? null
      : Number(saleRaw)

  const onSale = sale !== null && !Number.isNaN(sale) && sale > 0 && sale < base
  const price = onSale ? sale! : base
  const discountPercent = onSale && base > 0 ? Math.round((1 - sale! / base) * 100) : 0

  return {
    base,
    price,
    onSale,
    discountPercent,
    salePrice: onSale ? sale! : null,
  }
}

export function getTotalStock(variants: VariantRecord[] = []) {
  return variants.reduce((sum, v) => sum + Number(v.stock || 0), 0)
}

export function isProductPurchasable(
  product: ProductRecord,
  variants: VariantRecord[] = []
) {
  if (product.sold_out) return false
  if (product.is_active === false) return false
  const total = getTotalStock(variants)
  // If no variants configured yet, fall back to product-level sold_out only
  if (variants.length === 0) return !product.sold_out
  return total > 0
}

export const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
export const DEFAULT_COLORS = ['Grey', 'White', 'Black', 'Beige', 'Navy']
