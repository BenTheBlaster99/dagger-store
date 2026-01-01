'use client'

interface ProductCardGalleryProps {
  images: string[]
  alt: string
  className?: string
}

export function ProductCardGallery({ images, alt, className = '' }: ProductCardGalleryProps) {
  if (!images || images.length === 0) {
    return (
      <div className={`w-full h-64 bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500">No Image</span>
      </div>
    )
  }

  // Show only the first image
  const mainImage = images[0]

  return (
    <div className={`relative ${className}`}>
      {/* Main Image Display */}
      <div className="w-full h-64 bg-gray-200 overflow-hidden">
        <img
          src={mainImage}
          alt={alt}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23e5e7eb" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E'
          }}
        />
      </div>
    </div>
  )
}

