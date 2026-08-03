'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SiteFooter, SiteHeader, SiteMarquee } from '@/components/store/SiteChrome'
import { ProductCard } from '@/components/store/ProductCard'
import { CATEGORIES, fetchCatalogProducts, type CatalogProduct } from '@/lib/catalog'
import { getProductPricing } from '@/lib/product-pricing'

export default function Home() {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCatalogProducts()
      .then(setProducts)
      .catch((err) => setError(err.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  const featured = products.slice(0, 6)
  const saleCount = products.filter((p) => getProductPricing(p).onSale).length

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteMarquee />
      <SiteHeader />

      {/* Hero — full bleed, brand first */}
      <section className="relative h-[78vh] min-h-[520px] w-full overflow-hidden">
        <Image
          src="/heropicture.jpeg"
          alt="Dagger streetwear"
          fill
          priority
          className="object-cover brightness-[0.42]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-end px-4 pb-16 text-center md:pb-20">
          <p className="animate-rise font-editorial text-sm tracking-[0.35em] text-foreground/80 md:text-base">
            DAGGER.AC
          </p>
          <h1 className="animate-rise-delay font-display mt-3 text-6xl font-bold tracking-[0.08em] text-white md:text-8xl lg:text-9xl">
            Dagger
          </h1>
          <p className="animate-rise-delay font-gothic mt-5 max-w-xl text-lg tracking-[0.08em] text-foreground/80 md:text-2xl">
            Forged after the burn
          </p>
          <div className="animate-rise-delay mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/shop"
              className="bg-accent px-8 py-4 text-center text-sm font-bold tracking-[0.14em] text-accent-ink transition hover:bg-accent/90"
            >
              SHOP NOW
            </Link>
            <Link
              href="/sale"
              className="border-2 border-accent px-8 py-4 text-center text-sm font-bold tracking-[0.14em] text-accent transition hover:bg-accent hover:text-accent-ink"
            >
              {saleCount > 0 ? `SALE (${saleCount})` : 'NEW DROPS'}
            </Link>
          </div>
        </div>
      </section>

      {/* Featured drops */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="mb-10 text-center">
          <h2 className="font-editorial text-4xl md:text-5xl">Featured Drops</h2>
          <p className="mt-3 text-muted">
            Limited edition pieces — get them before they&apos;re gone
          </p>
        </div>

        {loading ? (
          <p className="py-16 text-center text-muted">Loading drops…</p>
        ) : error ? (
          <p className="py-16 text-center text-danger">{error}</p>
        ) : featured.length === 0 ? (
          <p className="py-16 text-center text-muted">No products yet. Check back soon.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-3">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link
                href="/shop"
                className="inline-flex border-2 border-foreground/30 px-8 py-3 text-sm font-bold tracking-[0.14em] transition hover:border-accent hover:bg-accent hover:text-accent-ink"
              >
                VIEW ALL PRODUCTS →
              </Link>
            </div>
          </>
        )}
      </section>

      {/* Categories */}
      <section className="bg-surface py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 sm:grid-cols-3">
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.slug}
              href={cat.href}
              className="group relative aspect-square overflow-hidden bg-surface-2"
            >
              <Image
                src="/heropicture.jpeg"
                alt={cat.name}
                fill
                className={`object-cover transition-transform duration-500 group-hover:scale-110 ${
                  i === 1 ? 'object-[center_30%]' : i === 2 ? 'object-[center_70%]' : ''
                }`}
              />
              <div className="absolute inset-0 bg-black/50 transition group-hover:bg-black/35" />
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="font-editorial text-3xl text-white md:text-4xl">{cat.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Join movement */}
      <section className="bg-accent px-4 py-20 text-accent-ink">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-editorial text-4xl md:text-6xl">Join the Movement</h2>
          <p className="mt-4 text-accent-ink/75">
            Be first on new drops, exclusive deals, and limited restocks.
          </p>
          <a
            href="https://www.instagram.com/dagger.ac/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex bg-background px-8 py-4 text-sm font-bold tracking-[0.14em] text-foreground transition hover:bg-brand"
          >
            FOLLOW ON INSTAGRAM
          </a>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
