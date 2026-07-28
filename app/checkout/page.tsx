'use client'

import { useEffect, useState, useMemo, useRef, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ShoppingBag, 
  Loader2, 
  Truck, 
  Handshake, 
  User, 
  Phone, 
  MapPin, 
  MessageCircle,
  Package,
  Home,
  CheckCircle,
  Palette,
  Menu,
  X,
  Instagram,
  Mail,
} from 'lucide-react'
import { InputField } from '@/components/InputField'
import { ProductImageGallery } from '@/components/ProductImageGallery'
import { ALGERIA_WILAYAS, WILAYA_COMMUNES, PRODUCT_SIZES, PRODUCT_COLORS } from '@/lib/constants'
import { DELIVERY_PRICES_BY_WILAYA, normalizeDeliveryKey } from '@/lib/deliveryPricing'
import {
  trackInitiateCheckout,
  trackPurchase,
  trackViewContent,
} from '@/lib/meta-pixel'
import { getProductPricing, isProductPurchasable } from '@/lib/product-pricing'
import { LucideIcon } from 'lucide-react'

// Delivery Options
const DELIVERY_OPTIONS = {
  HAND_TO_HAND: {
    label: "Hand-to-Hand Delivery (Algiers only)",
    price: 500, // DA
    icon: Handshake,
    description: "Direct meeting point delivery in Algiers wilaya.",
    wilaya_restriction: "Algiers",
  },
  BUREAU: {
    label: "Bureau Delivery (All Wilayas)",
    price: 700, // DA
    icon: Truck,
    description: "Delivery to bureau/post office across all Algerian wilayas.",
    wilaya_restriction: null,
  },
}

type DeliveryPricingEntry = {
  bureau?: number
  home?: number
  handToHand?: number
  base?: number
}

type DeliveryPricingMap = Record<string, DeliveryPricingEntry>


// Select Field Component
interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  icon: LucideIcon
  error?: string
  options: string[] | { id: number; name: string }[]
}

function SelectField({ label, icon: Icon, error, options, ...props }: SelectFieldProps) {
  const optionList = options.map(opt => typeof opt === 'string' ? opt : opt.name)
  
  return (
    <div className="space-y-1.5 group">
      <label className="text-xs uppercase tracking-wider text-gray-500 font-medium ml-1">
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>
      <div className={`
        relative flex items-center transition-all duration-200
        bg-gray-50 border rounded-lg overflow-hidden
        ${error 
          ? 'border-red-500 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/20' 
          : 'border-gray-300 hover:border-gray-400 focus-within:border-black focus-within:ring-1 focus-within:ring-black/20'}
      `}>
        <div className="pl-3 pr-2 text-gray-400 pointer-events-none">
          <Icon size={16} />
        </div>
        <select
          className="w-full bg-transparent border-none text-sm text-gray-900 p-3 appearance-none focus:outline-none focus:ring-0 cursor-pointer"
          {...props}
        >
          <option value="" disabled className="bg-white">Select {label}</option>
          {options.map((option, idx) => {
            const value = typeof option === 'string' ? option : option.name
            const display = typeof option === 'string' ? option : option.name
            return (
              <option key={idx} value={value} className="bg-white">
                {display}
              </option>
            )
          })}
        </select>
      </div>
      {error && (
        <p className="text-xs text-red-500 ml-1 flex items-center gap-1 animate-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  )
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const productId = searchParams.get('product')

  const [menuOpen, setMenuOpen] = useState(false)
  const [product, setProduct] = useState<any>(null)
  const [variants, setVariants] = useState<any[]>([])
  const [selectedDelivery, setSelectedDelivery] = useState<keyof typeof DELIVERY_OPTIONS>('BUREAU')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<{
    total_price: number
    quantity: number
    product_id: string
    product_name: string
  } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pixelTracked, setPixelTracked] = useState(false)
  const purchaseTracked = useRef(false)
  
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    address: '',
    wilaya: '',
    commune: '',
    notes: '',
    quantity: 1,
    size: '',
    color: ''
  })

  // Fetch product and variants from Supabase
  useEffect(() => {
    if (productId) {
      fetchProduct()
    } else {
      setLoading(false)
    }
  }, [productId])

  const deliveryPricing = useMemo<DeliveryPricingMap>(() => {
    return Object.entries(DELIVERY_PRICES_BY_WILAYA).reduce(
      (acc, [key, price]) => {
        acc[key] = { home: price, bureau: price, base: price }
        return acc
      },
      {} as DeliveryPricingMap
    )
  }, [])

  async function fetchProduct() {
    try {
      const { data: productData, error: productError } = await supabase
        .from('Products')
        .select('*')
        .eq('id', productId)
        .single()

      if (productError) throw productError

      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variant')
        .select('*')
        .eq('product_id', productId)

      if (variantsError) throw variantsError

      setProduct(productData)
      setVariants(variantsData || [])
    } catch (error: any) {
      setErrors({ general: 'Error loading product: ' + error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!product || pixelTracked) return

    const pricing = getProductPricing(product)
    const content = {
      content_ids: [String(product.id)],
      content_name: product.name,
      content_type: 'product',
      value: pricing.price,
      currency: 'DZD',
      num_items: 1,
    }
    trackViewContent(content)
    trackInitiateCheckout(content)
    setPixelTracked(true)
  }, [product, pixelTracked])

  useEffect(() => {
    if (!orderSuccess || !completedOrder || purchaseTracked.current) return
    purchaseTracked.current = true
    trackPurchase({
      content_ids: [completedOrder.product_id],
      content_name: completedOrder.product_name,
      value: completedOrder.total_price,
      currency: 'DZD',
      num_items: completedOrder.quantity,
    })
  }, [orderSuccess, completedOrder])

  // Computed values
  const deliveryOption = useMemo(() => 
    DELIVERY_OPTIONS[selectedDelivery], 
    [selectedDelivery]
  )

  const pricingKey = useMemo(() => {
    if (formData.wilaya) return normalizeDeliveryKey(formData.wilaya)
    return ''
  }, [formData.wilaya])

  const pricingForTerritory = useMemo(() => {
    if (!pricingKey) return undefined
    return deliveryPricing[pricingKey]
  }, [deliveryPricing, pricingKey])

  const deliveryPrice = useMemo(() => {
    if (selectedDelivery === 'BUREAU') {
      if (!pricingKey) return null
      return (
        pricingForTerritory?.bureau ??
        pricingForTerritory?.base ??
        DELIVERY_OPTIONS.BUREAU.price
      )
    }
    if (selectedDelivery === 'HAND_TO_HAND') {
      return (
        pricingForTerritory?.handToHand ??
        DELIVERY_OPTIONS.HAND_TO_HAND.price
      )
    }
    return DELIVERY_OPTIONS.BUREAU.price
  }, [pricingForTerritory, pricingKey, selectedDelivery])

  const getDisplayPriceForOption = (key: keyof typeof DELIVERY_OPTIONS) => {
    if (key === 'BUREAU') {
      if (!pricingKey) return null
      return (
        pricingForTerritory?.bureau ??
        pricingForTerritory?.base ??
        DELIVERY_OPTIONS.BUREAU.price
      )
    }
    if (key === 'HAND_TO_HAND') {
      return (
        pricingForTerritory?.handToHand ??
        DELIVERY_OPTIONS.HAND_TO_HAND.price
      )
    }
    return DELIVERY_OPTIONS.BUREAU.price
  }

  const wilayasForSelect = useMemo(() => {
    if (selectedDelivery === 'HAND_TO_HAND') {
      return ALGERIA_WILAYAS.filter(w => w.name === 'Algiers')
    }
    return ALGERIA_WILAYAS
  }, [selectedDelivery])

  const communesForWilaya = useMemo(() => {
    if (!formData.wilaya) return []
    return WILAYA_COMMUNES[formData.wilaya] || []
  }, [formData.wilaya])

  const productPricing = useMemo(() => {
    if (!product) return { base: 0, price: 0, onSale: false, discountPercent: 0, salePrice: null }
    return getProductPricing(product)
  }, [product])

  const productPrice = productPricing.price

  const availableSizes = useMemo(() => {
    const fromVariants = Array.from(
      new Set(
        variants
          .filter((v) => Number(v.stock || 0) > 0)
          .map((v) => v.size)
          .filter(Boolean)
      )
    ) as string[]
    return fromVariants.length > 0 ? fromVariants : PRODUCT_SIZES
  }, [variants])

  const availableColors = useMemo(() => {
    const fromVariants = Array.from(
      new Set(
        variants
          .filter((v) => {
            if (Number(v.stock || 0) <= 0) return false
            if (formData.size && v.size && v.size !== formData.size) return false
            return Boolean(v.color)
          })
          .map((v) => v.color)
          .filter(Boolean)
      )
    ) as string[]

    if (fromVariants.length > 0) {
      return fromVariants.map((color) => ({
        name: color,
        value: color.toLowerCase(),
        hex:
          PRODUCT_COLORS.find((c) => c.value === color.toLowerCase() || c.name === color)?.hex ||
          '#888888',
      }))
    }
    return PRODUCT_COLORS
  }, [variants, formData.size])

  const selectedVariantStock = useMemo(() => {
    if (!formData.size && !formData.color) return null
    const match = variants.find((v) => {
      const sizeOk = !formData.size || !v.size || v.size === formData.size
      const colorOk =
        !formData.color ||
        !v.color ||
        v.color.toLowerCase() === formData.color.toLowerCase()
      return sizeOk && colorOk
    })
    return match ? Number(match.stock || 0) : null
  }, [variants, formData.size, formData.color])

  const productSoldOut = useMemo(() => {
    if (!product) return true
    return !isProductPurchasable(product, variants)
  }, [product, variants])

  const subtotal = useMemo(() => {
    return productPrice * formData.quantity
  }, [productPrice, formData.quantity])

  const totalPrice = useMemo(() => {
    return subtotal + (deliveryPrice ?? 0)
  }, [subtotal, deliveryPrice])

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear commune when wilaya changes
    if (name === 'wilaya') {
      setFormData(prev => ({ ...prev, commune: '' }))
    }
    if (name === 'size') {
      setFormData(prev => ({ ...prev, color: '' }))
    }
    if (name === 'commune') {
      setErrors(prev => ({ ...prev, commune: '' }))
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleDeliveryChange = (key: keyof typeof DELIVERY_OPTIONS) => {
    setSelectedDelivery(key)
    if (key === 'HAND_TO_HAND') {
      const algiersWilaya = ALGERIA_WILAYAS.find(w => w.name === 'Algiers')
      if (algiersWilaya) {
        setFormData(prev => ({ ...prev, wilaya: algiersWilaya.name, commune: '' }))
      }
      setErrors(prev => ({ ...prev, wilaya: '', commune: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Full name is required'
    }
    
    const phoneRegex = /^(05|06|07)[0-9]{8}$/
    const cleanPhone = formData.phone.trim().replace(/\s/g, '')
    if (!cleanPhone) {
      newErrors.phone = 'Phone number is required'
    } else if (!phoneRegex.test(cleanPhone)) {
      newErrors.phone = 'Invalid format (e.g. 0550123456)'
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }
    
    if (!formData.wilaya) {
      newErrors.wilaya = 'Wilaya is required'
    }
    
    if (!formData.commune || !formData.commune.trim()) {
      newErrors.commune = 'Commune is required'
    }
    
    if (!formData.size) {
      newErrors.size = 'Size is required'
    }
    
    if (!formData.color) {
      newErrors.color = 'Color is required'
    }
    
    if (selectedDelivery === 'HAND_TO_HAND' && formData.wilaya !== 'Algiers') {
      newErrors.wilaya = 'Hand-to-Hand delivery is only available in Algiers'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Validate form first
    if (!validateForm()) {
      const firstErrorField = Object.keys(errors)[0]
      const element = document.querySelector(`[name="${firstErrorField}"]`)
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    if (!product) {
      setErrors({ general: 'Product not found' })
      return
    }

    if (!product.id) {
      setErrors({ general: 'Product ID is missing' })
      return
    }

    if (productSoldOut) {
      setErrors({ general: 'This product is sold out.' })
      return
    }

    if (
      selectedVariantStock !== null &&
      Number(formData.quantity) > selectedVariantStock
    ) {
      setErrors({
        quantity: `Only ${selectedVariantStock} left for this size/color`,
      })
      return
    }

    setSubmitting(true)
    setErrors({}) // Clear previous errors

    const phone = formData.phone.trim().replace(/\s/g, '')

    // Prepare order data
    const orderData = {
      customer_name: formData.customer_name.trim(),
      phone,
      address: formData.address.trim(),
      wilaya: formData.wilaya,
      commune: formData.commune.trim(),
      notes: formData.notes.trim() || null,
      delivery_method: deliveryOption.label,
      delivery_cost: Number(deliveryPrice ?? 0),
      total_price: Number(totalPrice),
      status: 'pending',
      size: formData.size || null,
      color: formData.color || null
    }

    // Prepare order item data
    const orderItemData = {
      order_id: '', // Will be set after order creation
      product_id: product.id,
      quantity: Number(formData.quantity),
      price: Number(productPrice),
      size: formData.size || null,
      color: formData.color || null
    }

    try {
      const { data: banRow, error: banError } = await supabase
        .from('banned_customers')
        .select('phone')
        .eq('phone', phone)
        .maybeSingle()

      if (banError && !banError.message.includes('Could not find the table')) {
        throw new Error(`Ban check failed: ${banError.message}`)
      }

      if (banRow) {
        throw new Error('This phone number cannot place orders. Please contact support.')
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()

      if (orderError) {
        if (orderError.message.includes('Could not find the table')) {
          throw new Error('Orders table not found. Please run the SQL migration in Supabase.')
        }
        if (orderError.message.includes('row-level security')) {
          throw new Error('RLS policy error. Please check your Supabase policies.')
        }
        throw new Error(`Order creation failed: ${orderError.message}`)
      }

      if (!order || !order.id) {
        throw new Error('Failed to create order - no order ID returned')
      }

      // Create order item
      orderItemData.order_id = order.id
      
      const { error: itemError } = await supabase
        .from('order_items')
        .insert(orderItemData)
        .select()
        .single()

      if (itemError) {
        if (itemError.message.includes('Could not find the table')) {
          throw new Error('Order_items table not found. Please run the SQL migration in Supabase.')
        }
        if (itemError.message.includes('row-level security')) {
          throw new Error('RLS policy error for order_items. Please check your Supabase policies.')
        }
        throw new Error(`Order item creation failed: ${itemError.message}`)
      }

      // Decrement stock for matching size/color variant
      try {
        await fetch('/api/adjust-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: product.id,
            quantity: Number(formData.quantity),
            size: formData.size || null,
            color: formData.color || null,
          }),
        })
      } catch (stockError) {
        console.error('Stock decrement failed:', stockError)
      }

      // WhatsApp + optional email (failures must not fail the order)
      try {
        await fetch('/api/notify-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customer_name: formData.customer_name.trim(),
            phone,
            address: formData.address.trim(),
            wilaya: formData.wilaya,
            commune: formData.commune.trim(),
            delivery_method: deliveryOption.label,
            delivery_cost: Number(deliveryPrice ?? 0),
            total_price: Number(totalPrice),
            product_name: product.name,
            quantity: Number(formData.quantity),
            size: formData.size || null,
            color: formData.color || null,
            notes: formData.notes.trim() || null,
          }),
        })
      } catch (notifyError) {
        console.error('Failed to send order notification:', notifyError)
      }

      setCompletedOrder({
        total_price: Number(totalPrice),
        quantity: Number(formData.quantity),
        product_id: String(product.id),
        product_name: product.name,
      })
      try {
        const sid = localStorage.getItem('dagger_sid')
        if (sid) {
          await fetch('/api/analytics/collect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: sid,
              path: typeof window !== 'undefined' ? window.location.pathname : '/checkout',
              converted: true,
              pageview: false,
              heartbeat: true,
            }),
          })
        }
      } catch {
        // ignore analytics failure
      }
      setOrderSuccess(true)
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred. Please try again.'
      setErrors({ general: errorMessage })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white text-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-3 text-lg font-medium">Loading checkout...</span>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white text-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link href="/" className="text-gray-600 hover:text-black underline">
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  if (orderSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white text-gray-900 p-4">
        <div className="bg-white border border-gray-200 text-gray-900 p-8 rounded-lg shadow-xl max-w-lg w-full text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-3">Order Confirmed!</h2>
          <p className="mb-6 text-gray-600">
            Thank you for your order. We will contact you shortly via phone to confirm the details.
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            <Home className="h-5 w-5 mr-2" /> Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Top Banner */}
      <div className="bg-[#E5525F] text-white text-center py-2 px-4 text-sm md:text-base font-bold sticky top-0 z-[60]">
        Exceptional clothing brand with limited stock with Dagger Clothing !
      </div>
      
      <header className="bg-black border-b border-gray-800/50 sticky top-[41px] z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 relative">
          <div className="flex items-center">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-white hover:text-gray-300 transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Logo - pushed to the right */}
            <Link href="/" className="flex-shrink-0 ml-auto">
              <Image
                src="/daggerLogo.avif"
                alt="The Dagger"
                width={160}
                height={60}
                className="h-14 w-auto object-contain"
                priority
              />
            </Link>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="absolute top-full left-0 right-0 bg-black border-b border-gray-800/50 shadow-lg">
              <nav className="px-4 py-4 space-y-3">
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="block text-white hover:text-gray-300 py-2 text-lg font-medium transition-colors"
                >
                  Home Page
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold mb-3 text-gray-900">Checkout</h1>
        </div>

        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {errors.general}
          </div>
        )}

        {/* Product Image Gallery - Large View */}
        <div className="mb-8">
          <ProductImageGallery
            images={Array.isArray(product.images) ? product.images : product.image ? [product.image] : []}
            alt={product.name}
          />
        </div>

        <form onSubmit={handleSubmit} className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Forms Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information Card */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-lg">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <User size={24} className="text-gray-700" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                  <p className="text-sm text-gray-500">Tell us who you are</p>
                </div>
              </div>
              
              <div className="space-y-5">
                <InputField
                  icon={User}
                  label="Full Name (Nom & Prénom)"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  required
                  error={errors.customer_name}
                />

                <InputField
                  icon={Phone}
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  error={errors.phone}
                />
              </div>
            </div>

            {/* Delivery Details Card */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-lg">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <MapPin size={24} className="text-gray-700" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Delivery Details</h2>
                  <p className="text-sm text-gray-500">Where should we deliver your order?</p>
                </div>
              </div>
              
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <SelectField
                    icon={MapPin}
                    label="Wilaya (State)"
                    name="wilaya"
                    value={formData.wilaya}
                    onChange={handleChange}
                    options={wilayasForSelect}
                    required
                    error={errors.wilaya}
                  />
                  
                  <SelectField
                    icon={MapPin}
                    label="Commune"
                    name="commune"
                    value={formData.commune}
                    onChange={handleChange}
                    options={communesForWilaya}
                    required
                    disabled={!formData.wilaya}
                    error={errors.commune}
                  />
                </div>

                <InputField
                  icon={Home}
                  label="Full Address (Street, Building, etc.)"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  error={errors.address}
                />

                <div className="space-y-1.5 group">
                  <label className="text-xs uppercase tracking-wider text-gray-500 font-medium ml-1 flex items-center gap-2">
                    <MessageCircle size={14} /> Notes (Optional)
                  </label>
                  <div className="relative flex items-center transition-all duration-200 bg-gray-50 border border-gray-300 hover:border-gray-400 focus-within:border-black focus-within:ring-1 focus-within:ring-black/20 rounded-lg overflow-hidden">
                    <div className="pl-3 pr-2 text-gray-400">
                      <MessageCircle size={16} />
                    </div>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Any specific delivery instructions..."
                      rows={3}
                      className="w-full bg-transparent border-none text-sm text-gray-900 p-3 placeholder-gray-400 focus:outline-none focus:ring-0 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1 mt-10" >
            <div className="sticky top-24 bg-white p-8 rounded-2xl border border-gray-200 shadow-xl">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <ShoppingBag size={24} className="text-gray-700" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>
                  <p className="text-sm text-gray-500">Review your order</p>
                </div>
              </div>
              
              {/* Product Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <p className="font-bold text-lg leading-tight text-gray-900 mb-1">{product.name}</p>
                {productPricing.onSale ? (
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="text-2xl font-extrabold text-gray-900">
                      {productPrice.toLocaleString()}{' '}
                      <span className="text-sm font-normal text-gray-600">DA</span>
                    </p>
                    <span className="text-sm text-gray-400 line-through">
                      {productPricing.base.toLocaleString()} DA
                    </span>
                    <span className="text-xs font-bold text-[#E5525F]">
                      -{productPricing.discountPercent}%
                    </span>
                  </div>
                ) : (
                  <p className="text-2xl font-extrabold text-gray-900">
                    {productPrice.toLocaleString()}{' '}
                    <span className="text-sm font-normal text-gray-600">DA</span>
                  </p>
                )}
                {productSoldOut && (
                  <p className="text-sm text-red-600 font-medium mt-2">Sold out</p>
                )}
                {selectedVariantStock !== null && selectedVariantStock > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedVariantStock} in stock for this option
                  </p>
                )}
              </div>

              {/* Size Selection */}
              <div className="mb-6">
                <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-3 flex items-center gap-2">
                  <Package size={16} /> Select Size <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {availableSizes.map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, size, color: '' }))
                        if (errors.size) {
                          setErrors(prev => ({ ...prev, size: '' }))
                        }
                      }}
                      className={`p-3 text-sm font-semibold rounded-lg border-2 transition-all ${
                        formData.size === size
                          ? 'bg-black text-white border-black shadow-md'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {errors.size && <p className="mt-2 text-xs text-red-500">{errors.size}</p>}
              </div>

              {/* Color Selection */}
              <div className="mb-6">
                <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-3 flex items-center gap-2">
                  <Palette size={16} /> Select Color <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {availableColors.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, color: color.value }))
                        if (errors.color) {
                          setErrors(prev => ({ ...prev, color: '' }))
                        }
                      }}
                      className={`p-4 text-sm font-medium rounded-xl border-2 transition-all flex items-center justify-center gap-3 ${
                        formData.color === color.value
                          ? 'border-black bg-gray-50 shadow-md'
                          : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'
                      }`}
                    >
                      <div 
                        className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="font-semibold">{color.name}</span>
                    </button>
                  ))}
                </div>
                {errors.color && <p className="mt-2 text-xs text-red-500">{errors.color}</p>}
              </div>

              {/* Quantity */}
              <div className="mb-6">
                <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  max={selectedVariantStock || undefined}
                  value={formData.quantity}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                />
                {errors.quantity && <p className="mt-2 text-xs text-red-500">{errors.quantity}</p>}
              </div>

              {/* Delivery Options */}
              <div className="mb-6">
                <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-3">
                  Delivery Method
                </label>
                <div className="space-y-2">
                  {Object.entries(DELIVERY_OPTIONS).map(([key, option]) => {
                    const Icon = option.icon
                    const displayPrice = getDisplayPriceForOption(key as keyof typeof DELIVERY_OPTIONS)
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleDeliveryChange(key as keyof typeof DELIVERY_OPTIONS)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          selectedDelivery === key 
                            ? 'bg-black text-white border-black shadow-lg' 
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-3">
                            <Icon size={22} className="flex-shrink-0" />
                            <span className="font-semibold text-base">{option.label}</span>
                          </div>
                          <span className={`text-base font-bold ${selectedDelivery === key ? 'text-white' : 'text-gray-900'}`}>
                            {displayPrice === null ? 'Select wilaya' : `+ ${displayPrice} DA`}
                          </span>
                        </div>
                        <p className={`text-xs mt-2 ${selectedDelivery === key ? 'text-gray-300' : 'text-gray-500'}`}>
                          {option.description}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Order Resume */}
              <div className="mb-6 p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <h3 className="font-bold text-sm mb-4 uppercase tracking-wider text-gray-700 flex items-center gap-2">
                  <Package size={16} /> Order Resume
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Product:</span>
                    <span className="font-semibold text-gray-900">{product.name}</span>
                  </div>
                  {formData.size && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Size:</span>
                      <span className="font-semibold text-gray-900">{formData.size}</span>
                    </div>
                  )}
                  {formData.color && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Color:</span>
                      <span className="font-semibold text-gray-900 capitalize">{formData.color}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-semibold text-gray-900">{formData.quantity}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-300 mt-3">
                    <span className="text-gray-700 font-medium">Subtotal:</span>
                    <span className="font-bold text-gray-900">{subtotal.toLocaleString()} DA</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Delivery:</span>
                    <span className="font-bold text-gray-900">
                      {deliveryPrice === null ? 'Select wilaya' : `${deliveryPrice.toLocaleString()} DA`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Price */}
              <div className="flex justify-between items-center pt-5 border-t-2 border-gray-300 mt-6 mb-6">
                <span className="text-xl font-bold text-gray-900">Total</span>
                <span className="text-3xl font-extrabold text-black">{totalPrice.toLocaleString()} <span className="text-lg font-normal text-gray-600">DA</span></span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || productSoldOut || !formData.size || !formData.color}
                className="w-full bg-black text-white h-14 rounded-xl font-bold text-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} /> Processing...
                  </>
                ) : (
                  <>
                    <ShoppingBag size={20} /> Place Order
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-500 mt-4 leading-relaxed">
                By placing an order, you agree to our <span className="underline">Terms & Conditions</span>.
              </p>
            </div>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center gap-4">
            {/* Social Media Icons */}
            <div className="flex items-center gap-6">
              <a
                href="https://www.instagram.com/dagger.ac/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-gray-900 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={24} />
              </a>
              <a
                href="https://www.tiktok.com/@dagger.ac"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-gray-900 transition-colors"
                aria-label="TikTok"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
              <a
                href="mailto:dagger.ac.pro@gmail.com"
                className="text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2"
                aria-label="Email"
              >
                <Mail size={24} />
                <span className="text-sm">dagger.ac.pro@gmail.com</span>
              </a>
            </div>
            {/* Copyright */}
            <p className="text-gray-600 text-sm">© {new Date().getFullYear()} The Dagger. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Force dynamic rendering to prevent static generation during build
export const dynamic = 'force-dynamic'

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-white text-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-3 text-lg font-medium">Loading checkout...</span>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
