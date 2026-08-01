'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { SiteFooter, SiteHeader, SiteMarquee } from '@/components/store/SiteChrome'
import { ProductCard } from '@/components/store/ProductCard'
import { CATEGORIES, fetchCatalogProducts, type CatalogProduct } from '@/lib/catalog'

function ShopContent() {
  const searchParams = useSearchParams()
  const category = searchParams.get('category')
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sort, setSort] = useState('featured')

  useEffect(() => {
    setLoading(true)
    fetchCatalogProducts({ category })
      .then(setProducts)
      .catch((err) => setError(err.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [category])

  const sorted = useMemo(() => {
    const list = [...products]
    if (sort === 'price-asc') {
      list.sort((a, b) => Number(a.base_price || 0) - Number(b.base_price || 0))
    } else if (sort === 'price-desc') {
      list.sort((a, b) => Number(b.base_price || 0) - Number(a.base_price || 0))
    }
    return list
  }, [products, sort])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteMarquee />
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-10 text-center">
          <h1 className="font-display text-5xl tracking-[0.18em] md:text-6xl">
            {category ? category.toUpperCase() : 'SHOP ALL'}
          </h1>
          <p className="mt-3 text-muted">
            {loading ? 'Loading…' : `${sorted.length} piece${sorted.length === 1 ? '' : 's'}`}
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/shop"
              className={`border px-3 py-1.5 text-xs tracking-[0.14em] ${
                !category
                  ? 'border-accent bg-accent text-accent-ink'
                  : 'border-border text-muted hover:border-foreground hover:text-foreground'
              }`}
            >
              ALL
            </Link>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={cat.href}
                className={`border px-3 py-1.5 text-xs tracking-[0.14em] ${
                  category === cat.slug
                    ? 'border-accent bg-accent text-accent-ink'
                    : 'border-border text-muted hover:border-foreground hover:text-foreground'
                }`}
              >
                {cat.name.toUpperCase()}
              </Link>
            ))}
            <Link
              href="/sale"
              className="border border-brand px-3 py-1.5 text-xs tracking-[0.14em] text-brand hover:bg-brand hover:text-white"
            >
              SALE
            </Link>
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-border bg-surface px-3 py-2 text-sm text-foreground"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>

        {error ? (
          <p className="py-20 text-center text-danger">{error}</p>
        ) : loading ? (
          <p className="py-20 text-center text-muted">Loading products…</p>
        ) : sorted.length === 0 ? (
          <p className="py-20 text-center text-muted">No products in this collection yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-3">
            {sorted.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  )
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background text-muted">
          Loading shop…
        </main>
      }
    >
      <ShopContent />
    </Suspense>
  )
}
