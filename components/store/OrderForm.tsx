'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  User,
  Phone,
  Building2,
  Signpost,
  ShoppingCart,
  Truck,
  Calculator,
  ShoppingBag,
  Loader2,
  CheckCircle,
  Home,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getCommunesForWilaya } from '@/lib/algeriaCommunes'
import { WILAYA_TARIFS, getWilayaDelivery } from '@/lib/deliveryPricing'
import { trackInitiateCheckout, trackPurchase } from '@/lib/meta-pixel'
import {
  getProductPricing,
  isProductPurchasable,
  type VariantRecord,
} from '@/lib/product-pricing'
import { productImages, type CatalogProduct } from '@/lib/catalog'

const BUNDLE_OPTIONS = [
  { qty: 1, savePercent: 0, popular: false },
  { qty: 2, savePercent: 10, popular: true },
] as const

type Props = {
  product: CatalogProduct
  variants: VariantRecord[]
  size: string
  color: string
  onSizeChange?: (size: string) => void
  onColorChange?: (color: string) => void
  sizes?: string[]
  colors?: string[]
  /** Side panel mode for product page split layout */
  embedded?: boolean
}

export default function OrderForm({
  product,
  variants,
  size,
  color,
  onSizeChange,
  onColorChange,
  sizes,
  colors,
  embedded = false,
}: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [checkoutTracked, setCheckoutTracked] = useState(false)
  const purchaseTracked = useRef(false)
  const [completedTotal, setCompletedTotal] = useState(0)
  const [deliveryMethod, setDeliveryMethod] = useState<'home' | 'bureau'>('home')
  const [bundleQty, setBundleQty] = useState(1)

  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    wilaya: '',
    commune: '',
    size,
    color,
  })

  useEffect(() => {
    setForm((prev) => ({ ...prev, size, color }))
  }, [size, color])

  const pricing = useMemo(() => getProductPricing(product), [product])
  const images = useMemo(() => productImages(product), [product])
  const thumb = images[0] || '/heropicture.jpeg'
  const unitPrice = pricing.price

  // Size/color come from the product's variants (via product page)
  const sizeOptions = sizes || []
  const colorOptions = colors || []

  const bundlePrice = useMemo(() => {
    const option = BUNDLE_OPTIONS.find((b) => b.qty === bundleQty) || BUNDLE_OPTIONS[0]
    const raw = unitPrice * option.qty
    const discounted = Math.round(raw * (1 - option.savePercent / 100))
    return { raw, discounted, savePercent: option.savePercent }
  }, [bundleQty, unitPrice])

  const communes = useMemo(() => getCommunesForWilaya(form.wilaya), [form.wilaya])

  const deliveryCost = useMemo(() => {
    if (!form.wilaya) return null
    return getWilayaDelivery(form.wilaya, deliveryMethod)
  }, [form.wilaya, deliveryMethod])

  const total = useMemo(() => {
    if (deliveryCost === null) return null
    return bundlePrice.discounted + deliveryCost
  }, [bundlePrice.discounted, deliveryCost])

  useEffect(() => {
    if (checkoutTracked) return
    trackInitiateCheckout({
      content_ids: [String(product.id)],
      content_name: product.name,
      value: pricing.price,
      currency: 'DZD',
      num_items: 1,
    })
    setCheckoutTracked(true)
  }, [checkoutTracked, product, pricing.price])

  // Live abandoned lead: save name/phone (and more) even if they never submit
  const leadSaved = useRef(false)
  useEffect(() => {
    if (orderSuccess || submitting) return
    const name = form.customer_name.trim()
    const phoneDigits = form.phone.replace(/\D/g, '')
    if (name.length < 2 || phoneDigits.length < 9) return

    const t = setTimeout(() => {
      leadSaved.current = true
      void fetch('/api/checkout-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          phone: form.phone.trim(),
          wilaya: form.wilaya || undefined,
          commune: form.commune || undefined,
          product_name: product.name,
          product_id: product.id,
          quantity: bundleQty,
          total_price: total,
          size: form.size || null,
          color: form.color || null,
        }),
      }).catch(() => {})
    }, 1200)

    return () => clearTimeout(t)
  }, [
    form.customer_name,
    form.phone,
    form.wilaya,
    form.commune,
    form.size,
    form.color,
    bundleQty,
    total,
    product.id,
    product.name,
    orderSuccess,
    submitting,
  ])

  useEffect(() => {
    if (!orderSuccess || purchaseTracked.current) return
    purchaseTracked.current = true
    trackPurchase({
      content_ids: [String(product.id)],
      content_name: product.name,
      value: completedTotal,
      currency: 'DZD',
      num_items: bundleQty,
    })
  }, [orderSuccess, product, completedTotal, bundleQty])

  function updateField(name: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'wilaya') next.commune = ''
      return next
    })
    if (name === 'size') onSizeChange?.(value)
    if (name === 'color') onColorChange?.(value)
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  function validate() {
    const next: Record<string, string> = {}
    if (!form.customer_name.trim()) next.customer_name = 'مطلوب'
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 9) {
      next.phone = 'رقم هاتف غير صالح'
    }
    if (!form.wilaya) next.wilaya = 'مطلوب'
    if (!form.commune) next.commune = 'مطلوب'
    if (!form.size) next.size = 'اختر المقاس'
    if (!form.color) next.color = 'اختر اللون'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    if (!isProductPurchasable(product, variants)) {
      setErrors({ general: 'هذا المنتج غير متوفر حالياً' })
      return
    }
    if (deliveryCost === null || total === null) {
      setErrors({ wilaya: 'اختر الولاية لحساب التوصيل' })
      return
    }

    setSubmitting(true)
    setErrors({})
    const phone = form.phone.trim().replace(/\s/g, '')

    try {
      const { data: banRow } = await supabase
        .from('banned_customers')
        .select('phone')
        .eq('phone', phone)
        .maybeSingle()
      if (banRow) throw new Error('لا يمكن إتمام الطلب بهذا الرقم')

      const orderData = {
        customer_name: form.customer_name.trim(),
        phone,
        address: form.commune,
        wilaya: form.wilaya,
        commune: form.commune,
        notes: null,
        delivery_method:
          deliveryMethod === 'home' ? 'Domicile' : 'Stop Desk / Bureau',
        delivery_cost: Number(deliveryCost),
        total_price: Number(total),
        status: 'pending',
        size: form.size || null,
        color: form.color || null,
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()
      if (orderError) throw new Error(orderError.message)

      const { error: itemError } = await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: product.id,
        quantity: bundleQty,
        price: Number(unitPrice),
        size: form.size || null,
        color: form.color || null,
      })
      if (itemError) throw new Error(itemError.message)

      try {
        await fetch('/api/adjust-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: product.id,
            quantity: bundleQty,
            size: form.size,
            color: form.color,
          }),
        })
      } catch {}

      try {
        await fetch('/api/checkout-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, converted: true }),
        })
      } catch {}

      try {
        await fetch('/api/notify-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: orderData.customer_name,
            phone,
            address: orderData.address,
            wilaya: form.wilaya,
            commune: form.commune,
            delivery_method: orderData.delivery_method,
            delivery_cost: deliveryCost,
            total_price: total,
            product_name: product.name,
            quantity: bundleQty,
            size: form.size,
            color: form.color,
            notes: null,
          }),
        })
      } catch {}

      try {
        const sid = localStorage.getItem('dagger_sid')
        if (sid) {
          await fetch('/api/analytics/collect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: sid,
              path: `/product/${product.id}`,
              converted: true,
              pageview: false,
              heartbeat: true,
            }),
          })
        }
      } catch {}

      setCompletedTotal(total)
      setOrderSuccess(true)
    } catch (err: unknown) {
      setErrors({
        general: err instanceof Error ? err.message : 'حدث خطأ، حاول مرة أخرى',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const wilayaOptions = WILAYA_TARIFS.map((w) => w.wilaya)

  if (orderSuccess) {
    return (
      <section
        id="order-form"
        className={
          embedded
            ? 'scroll-mt-28'
            : 'scroll-mt-28 border-t border-border bg-background px-4 py-12'
        }
        dir="rtl"
      >
        <div className="w-full rounded-2xl border border-border bg-surface p-6 text-center md:p-8">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
          <h2 className="font-editorial text-3xl text-foreground">تم تأكيد الطلب</h2>
          <p className="mt-3 text-sm text-muted">
            شكراً لك! سنتواصل معك قريباً لتأكيد التفاصيل.
          </p>
          <p className="mt-5 text-lg font-bold text-emerald-400">
            المجموع: {completedTotal.toLocaleString()} DZD
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center gap-2 bg-accent px-6 py-3 text-sm font-bold tracking-[0.12em] text-accent-ink"
          >
            <Home size={18} /> الرئيسية
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section
      id="order-form"
      className={
        embedded
          ? 'scroll-mt-28 h-full'
          : 'scroll-mt-28 border-t border-border bg-background px-4 py-10 md:py-14'
      }
      dir="rtl"
    >
      <form
        onSubmit={handleSubmit}
        className={`w-full space-y-3 ${embedded ? '' : 'mx-auto max-w-lg space-y-4'}`}
      >
        <div
          className={`rounded-2xl border border-border bg-surface ${
            embedded ? 'p-4' : 'p-5'
          }`}
        >
          <h2
            className={`text-center font-editorial text-foreground ${
              embedded ? 'text-2xl' : 'text-3xl'
            }`}
          >
            استمارة الطلب
          </h2>
          <p className="mt-1 text-center text-xs text-muted sm:text-sm">
            المرجو إدخال معلوماتك الخاصة بك
          </p>

          <div className={`space-y-2 ${embedded ? 'mt-4' : 'mt-6 space-y-3'}`}>
            {BUNDLE_OPTIONS.map((opt) => {
              const raw = unitPrice * opt.qty
              const price = Math.round(raw * (1 - opt.savePercent / 100))
              const selected = bundleQty === opt.qty
              return (
                <button
                  key={opt.qty}
                  type="button"
                  onClick={() => setBundleQty(opt.qty)}
                  className={`relative flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-right transition ${
                    selected
                      ? 'border-accent bg-surface-2'
                      : 'border-border bg-background hover:border-foreground/40'
                  }`}
                >
                  {opt.popular && (
                    <span className="absolute -top-2 left-3 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">
                      Most Popular
                    </span>
                  )}
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-surface-2">
                    <Image src={thumb} alt="" fill className="object-cover" sizes="48px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-semibold text-foreground">{opt.qty} pcs</span>
                      <span className="rounded-full border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-muted">
                        Save {opt.savePercent}%
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-muted">{product.name}</p>
                  </div>
                  <div className="text-left">
                    <span className="inline-flex rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-ink sm:text-sm">
                      {price.toLocaleString('en-US', { minimumFractionDigits: 2 })} DZD
                    </span>
                    {opt.savePercent > 0 && (
                      <p className="mt-1 text-[11px] text-muted line-through">
                        {raw.toLocaleString('en-US', { minimumFractionDigits: 2 })} DZD
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-muted">المقاس *</span>
              <select
                value={form.size}
                onChange={(e) => updateField('size', e.target.value)}
                className="form-select w-full rounded-xl border border-border px-3 py-2.5 outline-none focus:border-accent"
              >
                <option value="">Size</option>
                {sizeOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {errors.size && <p className="text-xs text-brand">{errors.size}</p>}
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-muted">اللون *</span>
              <select
                value={form.color}
                onChange={(e) => updateField('color', e.target.value)}
                className="form-select w-full rounded-xl border border-border px-3 py-2.5 outline-none focus:border-accent"
              >
                <option value="">Color</option>
                {colorOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.color && <p className="text-xs text-brand">{errors.color}</p>}
            </label>
          </div>

          <div className="mt-4 space-y-3">
            <Field label="الإسم الكامل" required icon={User} error={errors.customer_name} compact={embedded}>
              <input
                value={form.customer_name}
                onChange={(e) => updateField('customer_name', e.target.value)}
                placeholder="Nom complet"
                className="w-full bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted/60"
              />
            </Field>

            <Field label="الهاتف" required icon={Phone} error={errors.phone} compact={embedded}>
              <input
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="Numéro de téléphone"
                inputMode="tel"
                className="w-full bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted/60"
                dir="ltr"
              />
            </Field>

            <Field label="الولاية" required icon={Signpost} error={errors.wilaya} compact={embedded}>
              <select
                value={form.wilaya}
                onChange={(e) => updateField('wilaya', e.target.value)}
                className="form-select w-full appearance-none bg-transparent px-3 py-2.5 text-sm outline-none"
              >
                <option value="">Wilaya</option>
                {wilayaOptions.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="البلدية" required icon={Building2} error={errors.commune} compact={embedded}>
              <select
                value={form.commune}
                onChange={(e) => updateField('commune', e.target.value)}
                disabled={!form.wilaya}
                className="form-select w-full appearance-none bg-transparent px-3 py-2.5 text-sm outline-none disabled:opacity-50"
              >
                <option value="">Baladiya</option>
                {communes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted">نوع التوصيل</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('home')}
                  className={`rounded-xl border px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                    deliveryMethod === 'home'
                      ? 'border-accent bg-accent text-accent-ink'
                      : 'border-border text-foreground hover:border-foreground/50'
                  }`}
                >
                  للمنزل (Domicile)
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('bureau')}
                  className={`rounded-xl border px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                    deliveryMethod === 'bureau'
                      ? 'border-accent bg-accent text-accent-ink'
                      : 'border-border text-foreground hover:border-foreground/50'
                  }`}
                >
                  مكتب (Stop Desk)
                </button>
              </div>
            </div>
          </div>

          {errors.general && (
            <p className="mt-3 rounded-xl border border-brand/40 bg-brand/10 px-3 py-2 text-sm text-brand">
              {errors.general}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-3.5">
          <div className="space-y-2.5 rounded-xl bg-surface-2 p-3 text-sm">
            <SummaryRow
              icon={ShoppingCart}
              label="سعر المنتج"
              value={`DZD ${bundlePrice.discounted.toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}`}
            />
            <SummaryRow
              icon={Truck}
              label="سعر التوصيل"
              value={
                deliveryCost === null
                  ? '--'
                  : `DZD ${deliveryCost.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}`
              }
            />
            <div className="border-t border-border pt-2.5">
              <SummaryRow
                icon={Calculator}
                label="المجموع"
                value={
                  total === null
                    ? '--'
                    : `DZD ${total.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}`
                }
                strong
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-3 flex w-full items-center justify-center gap-2 bg-accent py-3.5 text-sm font-bold tracking-[0.12em] text-accent-ink transition hover:bg-accent/90 disabled:opacity-60 sm:text-base"
          >
            {submitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <ShoppingBag size={18} />
                إشتري الآن
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  )
}

function Field({
  label,
  required,
  icon: Icon,
  error,
  children,
  compact,
}: {
  label: string
  required?: boolean
  icon: typeof User
  error?: string
  children: React.ReactNode
  compact?: boolean
}) {
  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      <label className="text-sm font-medium text-muted">
        {label} {required && <span className="text-brand">*</span>}
      </label>
      <div className="flex items-center overflow-hidden rounded-xl border border-border bg-background focus-within:border-accent">
        <div className="flex h-full items-center justify-center border-l border-border bg-surface-2 px-2.5 text-muted">
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      {error && <p className="text-xs text-brand">{error}</p>}
    </div>
  )
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  strong,
}: {
  icon: typeof ShoppingCart
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className={`flex items-center justify-between gap-3 ${strong ? 'font-bold text-foreground' : 'text-muted'}`}>
      <span className="tabular-nums text-foreground" dir="ltr">
        {value}
      </span>
      <span className="inline-flex items-center gap-2">
        {label}
        <Icon size={16} className="text-muted" />
      </span>
    </div>
  )
}
