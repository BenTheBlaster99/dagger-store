import { supabase } from '@/lib/supabase'
import type { ProductRecord, VariantRecord } from '@/lib/product-pricing'

export type CatalogProduct = ProductRecord & {
  product_variant?: VariantRecord[]
  image?: string | null
}

export async function fetchCatalogProducts(options?: {
  category?: string | null
  onSaleOnly?: boolean
}) {
  let query = supabase
    .from('Products')
    .select('*, product_variant(*)')
    .or('is_active.is.null,is_active.eq.true')
    .order('name', { ascending: true })

  if (options?.category) {
    query = query.ilike('category', options.category)
  }

  const { data, error } = await query
  if (error) throw error

  let products = (data || []) as CatalogProduct[]

  if (options?.onSaleOnly) {
    products = products.filter((p) => {
      const base = Number(p.base_price || 0)
      const sale = Number(p.coupon_price || 0)
      return sale > 0 && sale < base
    })
  }

  return products
}

export function productImages(product: CatalogProduct) {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images.filter(Boolean)
  }
  if (product.image) return [product.image]
  return []
}

export const CATEGORIES = [
  { name: 'Hoodies', slug: 'Hoodie', href: '/shop?category=Hoodie' },
  { name: 'T-Shirts', slug: 'T-Shirt', href: '/shop?category=T-Shirt' },
  { name: 'Bottoms', slug: 'Bottoms', href: '/shop?category=Bottoms' },
]
