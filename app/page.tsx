import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ProductImage } from '@/components/ProductImage'

export default async function Home() {
  const { data: products, error } = await supabase
    .from('Products')
    .select('*')

  if (error) {
    return (
      <main className="min-h-screen p-10">
        <h1 className="text-3xl font-bold">The Dagger</h1>
        <p className="text-red-500 mt-4">Error loading products: {error.message}</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-4xl font-bold">THE DAGGER</h1>
          <p className="text-gray-400 mt-2">Premium Streetwear</p>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-5xl md:text-6xl font-bold mb-6">
          Welcome to The Dagger
        </h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Discover our premium collection of streetwear designed for those who demand quality.
        </p>
      </section>

      {/* Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!products || products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl">No products available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map(product => (
              <div key={product.id} className="bg-gray-800 rounded-lg overflow-hidden hover:shadow-2xl transition-shadow">
                {/* Product Image */}
                <div className="w-full h-64 bg-gray-700 flex items-center justify-center overflow-hidden">
                  <ProductImage 
                    src={product.images || product.image}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                {/* Product Info */}
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-2">{product.name}</h3>
                  {product.description && (
                    <p className="text-gray-400 mb-4">{product.description}</p>
                  )}
                  

                  <div className="flex items-center justify-between mt-6">
                    <span className="text-3xl font-bold">{product.base_price} DA</span>
                    <Link 
                      href={`/checkout?product=${product.id}`}
                      className="bg-white text-black px-6 py-2 rounded font-semibold hover:bg-gray-200 transition-colors"
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
      <footer className="border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-400">
          <p>© {new Date().getFullYear()} The Dagger. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
