'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ShoppingBag, 
  ArrowLeft, 
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
  Palette
} from 'lucide-react'
import { InputField } from '@/components/InputField'
import { ALGERIA_WILAYAS, WILAYA_COMMUNES, PRODUCT_SIZES, PRODUCT_COLORS } from '@/lib/constants'
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

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const productId = searchParams.get('product')

  const [product, setProduct] = useState<any>(null)
  const [variants, setVariants] = useState<any[]>([])
  const [selectedDelivery, setSelectedDelivery] = useState<keyof typeof DELIVERY_OPTIONS>('BUREAU')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
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
        .gt('stock', 0)

      if (variantsError) throw variantsError

      setProduct(productData)
      setVariants(variantsData || [])
    } catch (error: any) {
      console.error('Error fetching product:', error)
      setErrors({ general: 'Error loading product: ' + error.message })
    } finally {
      setLoading(false)
    }
  }

  // Computed values
  const deliveryOption = useMemo(() => 
    DELIVERY_OPTIONS[selectedDelivery], 
    [selectedDelivery]
  )

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

  const productPrice = useMemo(() => {
    if (!product) return 0
    return product.base_price || 0
  }, [product])

  const subtotal = useMemo(() => {
    return productPrice * formData.quantity
  }, [productPrice, formData.quantity])

  const totalPrice = useMemo(() => {
    return subtotal + deliveryOption.price
  }, [subtotal, deliveryOption.price])

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear commune when wilaya changes
    if (name === 'wilaya') {
      setFormData(prev => ({ ...prev, commune: '' }))
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
    
    // Log validation results for debugging
    if (Object.keys(newErrors).length > 0) {
      console.log('⚠️ Validation errors:', newErrors)
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

    setSubmitting(true)
    setErrors({}) // Clear previous errors

    // Prepare order data
    const orderData = {
      customer_name: formData.customer_name.trim(),
      phone: formData.phone.trim().replace(/\s/g, ''),
      address: formData.address.trim(),
      wilaya: formData.wilaya,
      commune: formData.commune.trim(),
      notes: formData.notes.trim() || null,
      delivery_method: deliveryOption.label,
      delivery_cost: Number(deliveryOption.price),
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

    console.log('📦 Submitting order with data:', {
      orderData,
      orderItemData: { ...orderItemData, order_id: 'will be set after order creation' },
      product: { id: product.id, name: product.name }
    })

    try {
      // Step 1: Create order
      console.log('Step 1: Creating order...')
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()

      if (orderError) {
        console.error('❌ Order creation error:', orderError)
        
        if (orderError.message.includes('Could not find the table')) {
          throw new Error('Orders table not found. Please run the SQL migration in Supabase.')
        }
        
        if (orderError.message.includes('row-level security')) {
          throw new Error('RLS policy error. Please run fix-rls-policies.sql in Supabase SQL Editor.')
        }
        
        // Show more detailed error
        throw new Error(`Order creation failed: ${orderError.message} (Code: ${orderError.code || 'unknown'})`)
      }

      if (!order || !order.id) {
        console.error('❌ Order created but no ID returned:', order)
        throw new Error('Failed to create order - no order ID returned')
      }

      console.log('✅ Order created successfully:', order.id)

      // Step 2: Create order item
      console.log('Step 2: Creating order item...')
      orderItemData.order_id = order.id
      
      const { data: orderItem, error: itemError } = await supabase
        .from('order_items')
        .insert(orderItemData)
        .select()
        .single()

      if (itemError) {
        console.error('❌ Order item creation error:', itemError)
        
        if (itemError.message.includes('Could not find the table')) {
          throw new Error('Order_items table not found. Please run the SQL migration in Supabase.')
        }
        
        if (itemError.message.includes('row-level security')) {
          throw new Error('RLS policy error for order_items. Please run fix-rls-policies.sql in Supabase SQL Editor.')
        }
        
        throw new Error(`Order item creation failed: ${itemError.message} (Code: ${itemError.code || 'unknown'})`)
      }

      console.log('✅ Order item created successfully:', orderItem)
      console.log('🎉 Complete order submitted:', { orderId: order.id, orderItemId: orderItem?.id })

      setOrderSuccess(true)
    } catch (error: any) {
      console.error('❌ Error submitting order:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      
      // Show user-friendly error message
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-black flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" /> The Dagger
          </Link>
          <Link href="/" className="text-sm text-gray-600 hover:text-black transition-colors flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Store
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <h1 className="text-4xl font-extrabold mb-8">Checkout</h1>
        <p className="text-lg text-gray-600 mb-10">Finalize your order by providing your delivery and contact details.</p>

        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="lg:grid lg:grid-cols-3 lg:gap-12">
          {/* Customer Information Form */}
          <div className="lg:col-span-2 bg-white p-8 rounded-xl border border-gray-200 shadow-lg mb-10 lg:mb-0">
            <h2 className="text-2xl font-bold mb-6 border-b border-gray-200 pb-3 flex items-center gap-2">
              <User size={20} /> Personal Information
            </h2>
            
            <InputField
              icon={User}
              label="Full Name (Nom & Prénom)"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              placeholder="John Doe"
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
              placeholder="0550123456"
              required
              error={errors.phone}
            />

            <h2 className="text-2xl font-bold mb-6 border-b border-gray-200 pb-3 mt-8 flex items-center gap-2">
              <MapPin size={20} /> Delivery Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
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
              placeholder="Apartment 4, Building 2, Street XYZ"
              required
              error={errors.address}
            />

            <div className="space-y-1.5 group">
              <label className="text-xs uppercase tracking-wider text-gray-500 font-medium ml-1">
                Notes (Optional)
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
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white p-8 rounded-xl border border-gray-200 shadow-lg">
              <h2 className="text-2xl font-bold mb-6 border-b border-gray-200 pb-3 flex items-center gap-2">
                <ShoppingBag size={20} /> Order Summary
              </h2>
              
              {/* Product Card */}
              <div className="flex items-center border-b border-gray-200 pb-4 mb-4">
                <div className="w-16 h-16 mr-4 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                  )}
                </div>
                <div className="flex-grow">
                  <p className="font-semibold leading-tight">{product.name}</p>
                  <p className="text-sm text-gray-600">
                    {productPrice.toLocaleString()} DA
                  </p>
                </div>
              </div>

              {/* Size Selection */}
              <div className="mb-6">
                <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-2 flex items-center gap-1">
                  <Package size={16} /> Select Size <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRODUCT_SIZES.map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, size }))
                        if (errors.size) {
                          setErrors(prev => ({ ...prev, size: '' }))
                        }
                      }}
                      className={`p-3 text-sm font-medium rounded-lg border transition-all ${
                        formData.size === size
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
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
                <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-2 flex items-center gap-1">
                  <Palette size={16} /> Select Color <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PRODUCT_COLORS.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, color: color.value }))
                        if (errors.color) {
                          setErrors(prev => ({ ...prev, color: '' }))
                        }
                      }}
                      className={`p-3 text-sm font-medium rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                        formData.color === color.value
                          ? 'border-black bg-gray-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div 
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span>{color.name}</span>
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
                  value={formData.quantity}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                />
              </div>

              {/* Delivery Options */}
              <div className="mb-6">
                <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">
                  Delivery Method
                </label>
                {Object.entries(DELIVERY_OPTIONS).map(([key, option]) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleDeliveryChange(key as keyof typeof DELIVERY_OPTIONS)}
                      className={`w-full text-left p-3 my-2 rounded-lg border transition-all ${
                        selectedDelivery === key 
                          ? 'bg-black text-white border-black' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Icon size={20} className="mr-3 flex-shrink-0" />
                          <span className="font-semibold">{option.label}</span>
                        </div>
                        <span className={`text-sm font-bold ${selectedDelivery === key ? 'text-white' : 'text-gray-900'}`}>
                          + {option.price} DA
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${selectedDelivery === key ? 'text-gray-300' : 'text-gray-500'}`}>
                        {option.description}
                      </p>
                    </button>
                  )
                })}
              </div>

              {/* Order Resume */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-bold text-sm mb-3 uppercase tracking-wider text-gray-700">Order Resume</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Product:</span>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  {formData.size && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Size:</span>
                      <span className="font-medium">{formData.size}</span>
                    </div>
                  )}
                  {formData.color && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Color:</span>
                      <span className="font-medium capitalize">{formData.color}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{formData.quantity}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{subtotal.toLocaleString()} DA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery:</span>
                    <span className="font-medium">{deliveryOption.price.toLocaleString()} DA</span>
                  </div>
                </div>
              </div>

              {/* Total Price */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-6 mb-6">
                <span className="text-xl font-bold">Total</span>
                <span className="text-3xl font-extrabold">{totalPrice.toLocaleString()} DA</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !formData.size || !formData.color}
                className="w-full bg-black text-white h-14 rounded-xl font-bold text-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <ShoppingBag size={20} /> Place Order
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-500 mt-3">
                By placing an order, you agree to our Terms & Conditions.
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
