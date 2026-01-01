'use client'

import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'

interface ProductImageGalleryProps {
  images: string[]
  alt: string
  className?: string
}

export function ProductImageGallery({ images, alt, className = '' }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const mainImageRef = useRef<HTMLDivElement>(null)
  
  if (!images || images.length === 0) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-100 ${className}`}>
        <span className="text-gray-400">No Image</span>
      </div>
    )
  }

  const mainImage = images[selectedIndex]

  // Handle swipe gestures
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null
    touchStartX.current = e.targetTouches[0].clientX
  }

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return
    
    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      // Swipe left - next image
      setSelectedIndex((prev) => (prev + 1) % images.length)
    }
    if (isRightSwipe) {
      // Swipe right - previous image
      setSelectedIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isFullscreen])

  // Update thumbnail carousel when selected index changes - center the selected thumbnail
  useEffect(() => {
    if (images.length <= 3) {
      return
    }

    // Center the selected thumbnail in the middle of the 3 visible thumbnails
    let newStart = selectedIndex - 1
    if (newStart < 0) newStart = images.length - 1
    
    setThumbnailStartIndex(newStart)
  }, [selectedIndex, images.length])

  // Get visible thumbnails (3 at a time with infinite loop)
  const getVisibleThumbnails = () => {
    if (images.length <= 3) {
      return images.map((img, idx) => ({ image: img, index: idx }))
    }

    const visible: { image: string; index: number }[] = []
    for (let i = 0; i < 3; i++) {
      const idx = (thumbnailStartIndex + i) % images.length
      visible.push({ image: images[idx], index: idx })
    }
    return visible
  }

  const visibleThumbnails = getVisibleThumbnails()

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index)
  }

  const handlePrevThumbnail = () => {
    if (images.length <= 3) return
    setThumbnailStartIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleNextThumbnail = () => {
    if (images.length <= 3) return
    setThumbnailStartIndex((prev) => (prev + 1) % images.length)
  }

  const handleFullscreenNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'next') {
      setSelectedIndex((prev) => (prev + 1) % images.length)
    } else {
      setSelectedIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }

  return (
    <>
      <div className={`relative ${className}`}>
        {/* Main Large Image - Clickable and Swipeable */}
        <div
          ref={mainImageRef}
          className="w-full h-96 md:h-[500px] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden rounded-2xl mb-4 cursor-pointer"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={() => setIsFullscreen(true)}
        >
          <img
            src={mainImage}
            alt={alt}
            className="w-full h-full object-cover"
            draggable={false}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E'
            }}
          />
        </div>

        {/* Thumbnail Gallery - 3 visible with infinite loop */}
        {images.length > 1 && (
          <div className="relative flex items-center gap-2">
            {images.length > 3 && (
              <button
                type="button"
                onClick={handlePrevThumbnail}
                className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                aria-label="Previous thumbnails"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            
            <div className="flex gap-2 flex-1 justify-center overflow-hidden">
              {visibleThumbnails.map(({ image, index }) => (
                <button
                  key={`thumb-${index}`}
                  type="button"
                  onClick={() => handleThumbnailClick(index)}
                  className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 overflow-hidden rounded-lg border-2 transition-all ${
                    selectedIndex === index
                      ? 'border-black ring-2 ring-black/30 scale-105'
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${alt} view ${index + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </button>
              ))}
            </div>

            {images.length > 3 && (
              <button
                type="button"
                onClick={handleNextThumbnail}
                className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                aria-label="Next thumbnails"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2"
            onClick={(e) => {
              e.stopPropagation()
              setIsFullscreen(false)
            }}
            aria-label="Close fullscreen"
          >
            <X size={32} />
          </button>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-2 bg-black/50 rounded-full"
                onClick={(e) => {
                  e.stopPropagation()
                  handleFullscreenNavigation('prev')
                }}
                aria-label="Previous image"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-2 bg-black/50 rounded-full"
                onClick={(e) => {
                  e.stopPropagation()
                  handleFullscreenNavigation('next')
                }}
                aria-label="Next image"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Fullscreen Image */}
          <div
            className="max-w-full max-h-full w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={images[selectedIndex]}
              alt={alt}
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          </div>

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full text-sm">
              {selectedIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </>
  )
}
