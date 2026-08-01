'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SiteFooter, SiteHeader, SiteMarquee } from '@/components/store/SiteChrome'
import { ProductCard } from '@/components/store/ProductCard'
import { fetchCatalogProducts, type CatalogProduct } from '@/lib/catalog'

export default function SalePage() {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCatalogProducts({ onSaleOnly: true })
      .then(setProducts)
      .catch((err) => setError(err.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteMarquee />
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold tracking-[0.3em] text-brand">LIMITED TIME</p>
          <h1 className="font-display mt-2 text-5xl tracking-[0.18em] md:text-6xl">SALE</h1>
          <p className="mt-3 text-muted">Marked-down drops — while stock lasts</p>
        </div>

        {error ? (
          <p className="py-20 text-center text-danger">{error}</p>
        ) : loading ? (
          <p className="py-20 text-center text-muted">Loading sale…</p>
        ) : products.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted">No sale items right now.</p>
            <Link
              href="/shop"
              className="mt-6 inline-flex border border-border px-6 py-3 text-sm tracking-[0.12em] hover:bg-accent hover:text-accent-ink"
            >
              BROWSE ALL
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  )
}
