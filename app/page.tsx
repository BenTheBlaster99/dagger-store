'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ProductCardGallery } from '@/components/ProductCardGallery'
import { Menu, X, Instagram, Mail } from 'lucide-react'
import Image from 'next/image'

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      const { data, error: fetchError } = await supabase
        .from('Products')
        .select('*')
      
      if (fetchError) {
        setError(fetchError.message)
      } else {
        setProducts(data || [])
      }
      setLoading(false)
    }
    fetchProducts()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
        <p>Loading...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen p-10 bg-white text-gray-900">
        <h1 className="text-3xl font-bold">The Dagger</h1>
        <p className="text-red-500 mt-4">Error loading products: {error}</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Top Banner */}
      <div className="bg-[#E5525F] text-white text-center py-2 px-4 text-sm md:text-base font-bold sticky top-0 z-[60]">
        Exceptional clothing brand with limited stock with Dagger Clothing !
      </div>
      
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-black sticky top-[41px] z-50">
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
            <div className="absolute top-full left-0 right-0 bg-black border-b border-gray-800/50">
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

      {/* Hero Section */}
      <section className="relative w-full">
        {/* Hero Image */}
        <div className="w-full h-[60vh] md:h-[80vh] relative overflow-hidden">
          <Image
            src="/heropicture.jpeg"
            alt="Hero"
            fill
            className="object-cover"
            priority
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        {/* Hero Text Overlay */}
        <div className="absolute inset-20 flex flex-col items-center justify-center text-center h-full">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-4 text-white" style={{ fontFamily: 'var(--font-cinzel)' }}>
            Dagger.AC
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl text-gray-200 font-medium tracking-wider" style={{ fontFamily: 'var(--font-cinzel)' }}>
            Born in Shadows. Worn in Light.
          </p>
        </div>
      </section>

      {/* Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 pb-20">
        {!products || products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-xl">No products available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map(product => (
              <div key={product.id} className="group bg-white rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-gray-900/10 transition-all duration-300 border border-gray-200 hover:border-gray-300">
                {/* Product Image */}
                <div className="relative overflow-hidden">
                  <ProductCardGallery 
                    images={Array.isArray(product.images) ? product.images : product.image ? [product.image] : []}
                    alt={product.name}
                  />
                </div>
                {/* Product Info */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-1 text-gray-900">{product.name}</h3>
                    {product.category && (
                      <p className="text-gray-500 text-sm uppercase tracking-wider">{product.category}</p>
                    )}
                  </div>
                  {product.description && (
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{product.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div>
                      <span className="text-3xl font-extrabold text-gray-900">{product.base_price.toLocaleString()}</span>
                      <span className="text-gray-500 text-sm ml-1">DA</span>
                    </div>
                    <Link 
                      href={`/checkout?product=${product.id}`}
                      className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Order Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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
    </main>
  )
}
