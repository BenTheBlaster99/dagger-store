'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, ArrowLeft, ChevronDown, Loader2, MapPin, Phone, User } from 'lucide-react'
import { InputField } from '@/components/InputField'
import { ALGERIA_WILAYAS } from '@/lib/constants'

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const productId = searchParams.get('product')

  const [product, setProduct] = useState<any>(null)
  const [variants, setVariants] = useState<any[]>([])
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<any>({})
  
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    address: '',
    wilaya: '',
    commune: '',
    notes: '',
    quantity: 1
  })

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
      
      if (variantsData && variantsData.length > 0) {
        setSelectedVariant(variantsData[0])
      }
    } catch (error: any) {
      console.error('Error fetching product:', error)
      alert('Error loading product: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: any = {};
    if (!formData.customer_name.trim()) newErrors.customer_name = "Full name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    // Basic Algerian phone regex (starts with 05, 06, 07 and has 10 digits total)
    else if (!/^(05|06|07)[0-9]{8}$/.test(formData.phone.replace(/\s/g, ''))) newErrors.phone = "Invalid format (e.g. 0550...)";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.wilaya) newErrors.wilaya = "Select a Wilaya";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateForm()) return;

    setSubmitting(true)

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: formData.customer_name,
          phone: formData.phone,
          address: formData.address,
          wilaya: formData.wilaya,
          commune: formData.commune,
          notes: formData.notes,
          status: 'pending'
        })
        .select()
        .single()

      if (orderError) throw orderError

      if (!selectedVariant && variants.length > 0) throw new Error('Please select a variant')
      if (variants.length === 0) throw new Error('No variants available')

      const price = selectedVariant?.price || product.base_price
      
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          variant_id: selectedVariant.id,
          quantity: formData.quantity,
          price: price
        })

      if (itemError) throw itemError

      // Use a custom UI for success instead of alert if possible, but alert is fine for now
      alert('Order placed successfully! ID: ' + order.id)
      router.push('/')
    } catch (error: any) {
      alert('Error placing order: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-500" />
      </main>
    )
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link href="/" className="text-zinc-400 hover:text-white underline">Return Home</Link>
        </div>
      </main>
    )
  }

  const finalPrice = selectedVariant?.price || product.base_price
  const totalPrice = finalPrice * formData.quantity

  return (
    <main className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-white selection:text-black">
      {/* Navbar */}
      <nav className="border-b border-zinc-900 sticky top-0 z-50 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tighter text-xl">
            THE DAGGER
          </Link>
          <Link href="/" className="text-zinc-400 hover:text-white text-sm font-medium flex items-center gap-2">
            <ArrowLeft size={16} /> Back
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-16">
          
          {/* LEFT: FORM */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">Checkout</h1>
              <p className="text-zinc-400">Enter your details to complete the order.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Contact */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800 pb-2">Contact Info</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <InputField 
                    label="Full Name" icon={User} required
                    value={formData.customer_name}
                    onChange={(e: any) => setFormData({ ...formData, customer_name: e.target.value })}
                    error={errors.customer_name}
                  />
                  <InputField 
                    label="Phone" icon={Phone} type="tel" required
                    value={formData.phone}
                    onChange={(e: any) => setFormData({ ...formData, phone: e.target.value })}
                    error={errors.phone}
                    placeholder="05..."
                  />
                </div>
              </div>

              {/* Shipping */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800 pb-2">Shipping</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Wilaya Select */}
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider text-gray-500 font-medium ml-1">Wilaya <span className="text-red-500">*</span></label>
                    <div className="relative flex items-center bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
                      <div className="pl-3 pr-2 text-zinc-500"><MapPin size={16} /></div>
                      <select 
                        className="w-full bg-transparent border-none text-sm text-white p-3 appearance-none cursor-pointer focus:outline-none"
                        value={formData.wilaya}
                        onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
                      >
                        <option value="">Select Wilaya...</option>
                        {ALGERIA_WILAYAS.map(w => <option key={w} value={w} className="bg-zinc-900">{w}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 pointer-events-none text-zinc-500" />
                    </div>
                    {errors.wilaya && <p className="text-xs text-red-400 ml-1">{errors.wilaya}</p>}
                  </div>

                  <InputField 
                    label="Commune" icon={MapPin}
                    value={formData.commune}
                    onChange={(e: any) => setFormData({ ...formData, commune: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-gray-500 font-medium ml-1">Full Address <span className="text-red-500">*</span></label>
                  <textarea
                    rows={3}
                    className={`w-full bg-zinc-900/50 border rounded-lg p-3 text-sm text-white focus:outline-none focus:border-white transition-all ${errors.address ? 'border-red-500/50' : 'border-zinc-800'}`}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                   {errors.address && <p className="text-xs text-red-400 ml-1">{errors.address}</p>}
                </div>
                
                <div className="space-y-1.5">
                   <label className="text-xs uppercase tracking-wider text-gray-500 font-medium ml-1">Notes</label>
                   <textarea
                    rows={2}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-white"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
            </form>
          </div>

          {/* RIGHT: SUMMARY */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-24 bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-sm">
               {/* Product Info Header */}
               <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex gap-4">
                  <div className="w-20 h-24 bg-zinc-800 rounded-md overflow-hidden shrink-0">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">No IMG</div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{product.name}</h3>
                    <p className="text-zinc-400 text-xs mt-1 line-clamp-2">{product.description}</p>
                  </div>
               </div>

               <div className="p-6 space-y-6">
                 {/* Variants */}
                 {variants.length > 0 ? (
                    <div>
                      <label className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-3 block">Select Style</label>
                      <div className="grid grid-cols-2 gap-2">
                        {variants.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setSelectedVariant(v)}
                            className={`p-3 rounded-xl border text-left transition-all ${selectedVariant?.id === v.id ? 'bg-white text-black border-white' : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
                          >
                            <div className="text-sm font-bold">{v.color}</div>
                            <div className="text-xs mt-1">{v.stock} left</div>
                          </button>
                        ))}
                      </div>
                    </div>
                 ) : (
                   <p className="text-red-400 text-sm">No variants found.</p>
                 )}

                 {/* Quantity */}
                 <div>
                    <label className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-3 block">Quantity</label>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setFormData(p => ({...p, quantity: Math.max(1, p.quantity - 1)}))} className="w-10 h-10 border border-zinc-700 rounded-lg text-white hover:bg-zinc-800">-</button>
                      <span className="text-xl font-bold font-mono">{formData.quantity}</span>
                      <button onClick={() => setFormData(p => ({...p, quantity: Math.min(selectedVariant?.stock || 10, p.quantity + 1)}))} className="w-10 h-10 border border-zinc-700 rounded-lg text-white hover:bg-zinc-800">+</button>
                    </div>
                 </div>
               </div>

               {/* Total */}
               <div className="p-6 bg-zinc-900/80 border-t border-zinc-800 space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-zinc-500 uppercase text-xs">Total</span>
                    <span className="text-2xl font-bold text-white">{totalPrice} DA</span>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !selectedVariant}
                    className="w-full bg-white text-black h-12 rounded-xl font-bold hover:bg-zinc-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="animate-spin" /> : <><ShoppingBag size={18} /> Confirm Order</>}
                  </button>
               </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}