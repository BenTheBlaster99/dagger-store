'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  X,
} from 'lucide-react'
import { AdminNav } from '@/components/AdminNav'
import {
  CLOTHING_SIZES,
  DEFAULT_COLORS,
  getProductPricing,
  getTotalStock,
} from '@/lib/product-pricing'

type VariantDraft = {
  key: string
  size: string
  color: string
  stock: number
}

type Product = {
  id: string
  name: string
  description?: string | null
  category?: string | null
  base_price: number
  coupon_price?: number | null
  images?: string[] | null
  sold_out?: boolean
  is_active?: boolean
  product_variant?: Array<{
    id: string
    size?: string | null
    color?: string | null
    stock?: number | null
  }>
}

const emptyForm = {
  name: '',
  description: '',
  category: 'T-Shirt',
  base_price: '',
  coupon_price: '',
  images_text: '',
  sold_out: false,
  is_active: true,
}

function newVariant(partial?: Partial<VariantDraft>): VariantDraft {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    size: partial?.size || 'M',
    color: partial?.color || 'Black',
    stock: partial?.stock ?? 0,
  }
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [variants, setVariants] = useState<VariantDraft[]>([
    newVariant({ size: 'M', color: 'Black', stock: 10 }),
    newVariant({ size: 'L', color: 'Black', stock: 10 }),
  ])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/products')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load products')
      setProducts(data.products || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const discountPreview = useMemo(() => {
    const base = Number(form.base_price || 0)
    const sale = form.coupon_price === '' ? null : Number(form.coupon_price)
    if (!base || sale === null || Number.isNaN(sale) || sale <= 0 || sale >= base) return null
    return Math.round((1 - sale / base) * 100)
  }, [form.base_price, form.coupon_price])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setVariants([
      newVariant({ size: 'S', color: 'Black', stock: 0 }),
      newVariant({ size: 'M', color: 'Black', stock: 0 }),
      newVariant({ size: 'L', color: 'Black', stock: 0 }),
      newVariant({ size: 'XL', color: 'Black', stock: 0 }),
    ])
    setShowForm(true)
  }

  function openEdit(product: Product) {
    setEditingId(product.id)
    setForm({
      name: product.name || '',
      description: product.description || '',
      category: product.category || 'T-Shirt',
      base_price: String(product.base_price ?? ''),
      coupon_price:
        product.coupon_price === null || product.coupon_price === undefined
          ? ''
          : String(product.coupon_price),
      images_text: (product.images || []).join('\n'),
      sold_out: Boolean(product.sold_out),
      is_active: product.is_active !== false,
    })
    const existing = product.product_variant || []
    setVariants(
      existing.length > 0
        ? existing.map((v) =>
            newVariant({
              size: v.size || 'M',
              color: v.color || 'Black',
              stock: Number(v.stock || 0),
            })
          )
        : [newVariant()]
    )
    setShowForm(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      base_price: Number(form.base_price),
      coupon_price: form.coupon_price === '' ? null : Number(form.coupon_price),
      images_text: form.images_text,
      sold_out: form.sold_out,
      is_active: form.is_active,
      variants: variants.map((v) => ({
        size: v.size,
        color: v.color,
        stock: Number(v.stock || 0),
      })),
    }

    try {
      const res = await fetch(
        editingId ? `/api/admin/products/${editingId}` : '/api/admin/products',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  function fillSizeColorGrid() {
    const colors = Array.from(
      new Set(variants.map((v) => v.color.trim()).filter(Boolean).concat(['Black', 'White']))
    ).slice(0, 4)
    const next: VariantDraft[] = []
    for (const color of colors) {
      for (const size of ['S', 'M', 'L', 'XL']) {
        const existing = variants.find((v) => v.size === size && v.color === color)
        next.push(
          newVariant({
            size,
            color,
            stock: existing ? existing.stock : 0,
          })
        )
      }
    }
    setVariants(next)
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <AdminNav subtitle={`${products.length} products in catalog`} />

      <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        <div className="flex flex-wrap gap-2 justify-between">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-black text-white text-sm"
          >
            <Plus size={14} /> Add product
          </button>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-neutral-300 text-sm"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {error && (
          <div className="border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-neutral-200 p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                {editingId ? 'Edit product' : 'New product'}
              </h2>
              <button type="button" onClick={() => setShowForm(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="space-y-1 text-sm">
                <span className="text-xs uppercase text-neutral-500">Name *</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-neutral-300 px-3 py-2"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs uppercase text-neutral-500">Category</span>
                <input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="T-Shirt, Hoodie..."
                  className="w-full border border-neutral-300 px-3 py-2"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs uppercase text-neutral-500">Base price (DA) *</span>
                <input
                  required
                  type="number"
                  min="1"
                  value={form.base_price}
                  onChange={(e) => setForm((f) => ({ ...f, base_price: e.target.value }))}
                  className="w-full border border-neutral-300 px-3 py-2"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs uppercase text-neutral-500">
                  Sale price (DA) {discountPreview ? `· -${discountPreview}%` : ''}
                </span>
                <input
                  type="number"
                  min="0"
                  value={form.coupon_price}
                  onChange={(e) => setForm((f) => ({ ...f, coupon_price: e.target.value }))}
                  placeholder="Leave empty = no discount"
                  className="w-full border border-neutral-300 px-3 py-2"
                />
              </label>
            </div>

            <label className="block space-y-1 text-sm">
              <span className="text-xs uppercase text-neutral-500">Description</span>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full border border-neutral-300 px-3 py-2"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="text-xs uppercase text-neutral-500">
                Image URLs (one per line)
              </span>
              <textarea
                rows={3}
                value={form.images_text}
                onChange={(e) => setForm((f) => ({ ...f, images_text: e.target.value }))}
                placeholder="https://...jpg"
                className="w-full border border-neutral-300 px-3 py-2 font-mono text-xs"
              />
            </label>

            <div className="flex flex-wrap gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.sold_out}
                  onChange={(e) => setForm((f) => ({ ...f, sold_out: e.target.checked }))}
                />
                Sold out (force)
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                Visible on store
              </label>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium text-sm">Stock by size & color</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={fillSizeColorGrid}
                    className="text-xs px-2 py-1 border border-neutral-300"
                  >
                    Fill S–XL grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setVariants((v) => [...v, newVariant()])}
                    className="text-xs px-2 py-1 border border-neutral-300"
                  >
                    + Row
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {variants.map((variant, idx) => (
                  <div key={variant.key} className="grid grid-cols-12 gap-2 items-center">
                    <select
                      value={variant.size}
                      onChange={(e) =>
                        setVariants((list) =>
                          list.map((v, i) =>
                            i === idx ? { ...v, size: e.target.value } : v
                          )
                        )
                      }
                      className="col-span-3 border border-neutral-300 px-2 py-1.5 text-sm"
                    >
                      {CLOTHING_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                    <input
                      list="color-options"
                      value={variant.color}
                      onChange={(e) =>
                        setVariants((list) =>
                          list.map((v, i) =>
                            i === idx ? { ...v, color: e.target.value } : v
                          )
                        )
                      }
                      placeholder="Color"
                      className="col-span-4 border border-neutral-300 px-2 py-1.5 text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      value={variant.stock}
                      onChange={(e) =>
                        setVariants((list) =>
                          list.map((v, i) =>
                            i === idx ? { ...v, stock: Number(e.target.value || 0) } : v
                          )
                        )
                      }
                      className="col-span-3 border border-neutral-300 px-2 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setVariants((list) => list.filter((_, i) => i !== idx))
                      }
                      className="col-span-2 text-red-600 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <datalist id="color-options">
                {DEFAULT_COLORS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <p className="text-xs text-neutral-500">
                Total pieces: {variants.reduce((s, v) => s + Number(v.stock || 0), 0)}
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editingId ? 'Save changes' : 'Create product'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="py-20 flex items-center justify-center gap-2 text-neutral-500">
            <Loader2 className="animate-spin" size={18} />
            Loading products…
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-neutral-500">
            No products yet. Add your first tee.
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => {
              const pricing = getProductPricing(product)
              const stock = getTotalStock(product.product_variant || [])
              const soldOut = product.sold_out || stock === 0

              return (
                <article
                  key={product.id}
                  className="bg-white border border-neutral-200 p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex gap-3 min-w-0">
                      {product.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-16 h-16 object-cover border border-neutral-200"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-neutral-100 border border-neutral-200" />
                      )}
                      <div className="min-w-0">
                        <h2 className="font-semibold truncate">{product.name}</h2>
                        <p className="text-xs text-neutral-500 uppercase tracking-wide">
                          {product.category || 'Uncategorized'}
                          {!product.is_active ? ' · Hidden' : ''}
                          {soldOut ? ' · Sold out' : ''}
                          {pricing.onSale ? ` · -${pricing.discountPercent}%` : ''}
                        </p>
                        <p className="text-sm mt-1">
                          {pricing.onSale ? (
                            <>
                              <span className="font-semibold">
                                {pricing.price.toLocaleString()} DA
                              </span>
                              <span className="text-neutral-400 line-through ml-2">
                                {pricing.base.toLocaleString()} DA
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold">
                              {pricing.base.toLocaleString()} DA
                            </span>
                          )}
                          <span className="text-neutral-500 ml-3">
                            {stock} pieces left
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(product)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-neutral-300"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-red-300 text-red-700"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>

                  {(product.product_variant || []).length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="text-neutral-500 border-b border-neutral-200">
                            <th className="py-1 pr-3 font-medium">Size</th>
                            <th className="py-1 pr-3 font-medium">Color</th>
                            <th className="py-1 font-medium">Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(product.product_variant || []).map((v) => (
                            <tr key={v.id} className="border-b border-neutral-100">
                              <td className="py-1 pr-3">{v.size || '-'}</td>
                              <td className="py-1 pr-3">{v.color || '-'}</td>
                              <td className="py-1">{v.stock ?? 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
