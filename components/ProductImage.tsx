'use client'

import { useState } from 'react'

interface ProductImageProps {
  src?: string | string[]
  alt: string
  className?: string
}

export function ProductImage({ src, alt, className = '' }: ProductImageProps) {
  const [imageError, setImageError] = useState(false)
  
  // Get the first image if it's an array, or use the single image
  const imageUrl = Array.isArray(src) ? src[0] : src
  
  // Fallback placeholder SVG
  const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23374151" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E'

  if (!imageUrl || imageError) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-700 ${className}`}>
        <span className="text-gray-500">No Image</span>
      </div>
    )
  }

  return (
    <img 
      src={imageUrl} 
      alt={alt} 
      className={className}
      onError={() => setImageError(true)}
    />
  )
}


