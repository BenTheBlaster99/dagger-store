'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SiteFooter, SiteHeader, SiteMarquee } from '@/components/store/SiteChrome'
import OrderForm from '@/components/store/OrderForm'
import {
  getProductPricing,
  getTotalStock,
  isProductPurchasable,
  CLOTHING_SIZES,
  DEFAULT_COLORS,
  type VariantRecord,
} from '@/lib/product-pricing'
import { productImages, type CatalogProduct } from '@/lib/catalog'
import { trackViewContent } from '@/lib/meta-pixel'

function ProductPageContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = String(params.id || '')

  const [product, setProduct] = useState<CatalogProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeImage, setActiveImage] = useState(0)
  const [size, setSize] = useState(searchParams.get('size') || '')
  const [color, setColor] = useState(searchParams.get('color') || '')
  const [tracked, setTracked] = useState(false)

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('Products')
        .select('*, product_variant(*)')
        .eq('id', id)
        .single()

      if (fetchError) {
        setError(fetchError.message)
        setProduct(null)
      } else {
        setProduct(data as CatalogProduct)
      }
      setLoading(false)
    }
    load()
  }, [id])

  const images = useMemo(() => (product ? productImages(product) : []), [product])
  const variants = (product?.product_variant || []) as VariantRecord[]
  const pricing = product ? getProductPricing(product) : null
  const stock = getTotalStock(variants)
  const canBuy = product ? isProductPurchasable(product, variants) : false

  const availableSizes = useMemo(() => {
    const fromVariants = Array.from(
      new Set(variants.filter((v) => Number(v.stock || 0) > 0).map((v) => v.size).filter(Boolean))
    ) as string[]
    return fromVariants.length > 0 ? fromVariants : CLOTHING_SIZES
  }, [variants])

  const availableColors = useMemo(() => {
    const fromVariants = Array.from(
      new Set(
        variants
          .filter((v) => {
            if (Number(v.stock || 0) <= 0) return false
            if (size && v.size && v.size !== size) return false
            return Boolean(v.color)
          })
          .map((v) => v.color)
          .filter(Boolean)
      )
    ) as string[]
    return fromVariants.length > 0 ? fromVariants : DEFAULT_COLORS
  }, [variants, size])

  useEffect(() => {
    if (!product || !pricing || tracked) return
    trackViewContent({
      content_ids: [String(product.id)],
      content_name: product.name,
      value: pricing.price,
      currency: 'DZD',
    })
    setTracked(true)
  }, [product, pricing, tracked])

  useEffect(() => {
    if (loading || !canBuy) return
    if (typeof window === 'undefined') return
    if (window.location.hash === '#order-form') {
      requestAnimationFrame(() => {
        document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [loading, canBuy])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-muted">
        <Loader2 className="animate-spin" />
      </main>
    )
  }

  if (error || !product || !pricing) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <SiteMarquee />
        <SiteHeader />
        <div className="px-4 py-24 text-center">
          <h1 className="font-display text-4xl tracking-[0.14em]">PRODUCT NOT FOUND</h1>
          <Link href="/shop" className="mt-6 inline-block text-brand underline">
            Back to shop
          </Link>
        </div>
        <SiteFooter />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteMarquee />
      <SiteHeader />

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-2 lg:items-start lg:gap-10 lg:py-10">
        {/* Left: gallery + product details */}
        <div className="space-y-5 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2">
          <div className="relative aspect-square max-h-[min(58vh,560px)] w-full overflow-hidden rounded-md bg-surface-2 lg:aspect-auto lg:h-[min(52vh,520px)]">
            {images[activeImage] ? (
              <Image
                src={images[activeImage]}
                alt={product.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted">No image</div>
            )}
            {pricing.onSale && (
              <span className="absolute left-3 top-3 bg-brand px-2.5 py-1 text-xs font-bold text-white">
                -{pricing.discountPercent}% OFF
              </span>
            )}
            {!canBuy && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                <span className="bg-danger px-3 py-1 text-xs font-bold text-white">SOLD OUT</span>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden border sm:h-20 sm:w-20 ${
                    idx === activeImage ? 'border-accent' : 'border-border'
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              {product.category || 'Streetwear'}
            </p>
            <h1 className="font-editorial mt-2 text-3xl md:text-4xl lg:text-[2.6rem]">
              {product.name}
            </h1>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl font-bold md:text-3xl">
                {pricing.price.toLocaleString()} DA
              </span>
              {pricing.onSale && (
                <span className="text-base text-muted line-through md:text-lg">
                  {pricing.base.toLocaleString()} DA
                </span>
              )}
            </div>

            {product.description && (
              <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
                {product.description}
              </p>
            )}

            {canBuy && stock > 0 && stock <= 8 && (
              <p className="mt-3 text-sm font-medium text-brand">Only {stock} pieces left</p>
            )}

            <div className="mt-6 space-y-3">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Size</p>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSize(s)
                      setColor('')
                    }}
                    className={`min-w-12 border px-3 py-2 text-sm font-semibold ${
                      size === s
                        ? 'border-accent bg-accent text-accent-ink'
                        : 'border-border hover:border-foreground'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Color</p>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`border px-4 py-2 text-sm font-semibold capitalize ${
                      color.toLowerCase() === c.toLowerCase()
                        ? 'border-accent bg-accent text-accent-ink'
                        : 'border-border hover:border-foreground'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <Link
              href="/shop"
              className="mt-6 inline-block text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
            >
              Continue shopping
            </Link>
          </div>
        </div>

        {/* Right: order form */}
        <div className="lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pl-2">
          {canBuy ? (
            <OrderForm
              product={product}
              variants={variants}
              size={size}
              color={color}
              onSizeChange={setSize}
              onColorChange={setColor}
              sizes={availableSizes}
              colors={availableColors}
              embedded
            />
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-8 text-center">
              <p className="font-display text-2xl tracking-[0.14em] text-muted">SOLD OUT</p>
              <Link href="/shop" className="mt-4 inline-block text-sm text-brand underline">
                Back to shop
              </Link>
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}

export default function ProductPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background text-muted">
          <Loader2 className="animate-spin" />
        </main>
      }
    >
      <ProductPageContent />
    </Suspense>
  )
}
