'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  getProductPricing,
  getTotalStock,
  isProductPurchasable,
} from '@/lib/product-pricing'
import { productImages, type CatalogProduct } from '@/lib/catalog'

export function ProductCard({ product }: { product: CatalogProduct }) {
  const images = productImages(product)
  const pricing = getProductPricing(product)
  const variants = product.product_variant || []
  const stock = getTotalStock(variants)
  const canBuy = isProductPurchasable(product, variants)
  const soldOut = !canBuy

  return (
    <Link
      href={`/product/${product.id}`}
      className="group block space-y-3"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-surface-2">
        {images[0] ? (
          <Image
            src={images[0]}
            alt={product.name}
            fill
            sizes="(max-width:768px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">No image</div>
        )}

        {pricing.onSale && (
          <span className="absolute left-2 top-2 bg-brand px-2 py-1 text-[10px] font-bold tracking-wider text-white">
            -{pricing.discountPercent}%
          </span>
        )}

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/75">
            <span className="bg-danger px-3 py-1 text-xs font-bold tracking-wider text-white">
              SOLD OUT
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-semibold transition-colors group-hover:text-brand md:text-base">
          {product.name}
        </h3>
        {product.category && (
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
            {product.category}
          </p>
        )}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-price">
            {pricing.price.toLocaleString()} DA
          </span>
          {pricing.onSale && (
            <span className="text-sm text-muted line-through">
              {pricing.base.toLocaleString()} DA
            </span>
          )}
        </div>
        {!soldOut && stock > 0 && stock <= 5 && (
          <p className="text-xs font-medium text-brand">Only {stock} left</p>
        )}
      </div>
    </Link>
  )
}
