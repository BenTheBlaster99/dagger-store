'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'

type ProductGalleryProps = {
  images: string[]
  alt: string
  badge?: React.ReactNode
  overlay?: React.ReactNode
}

export function ProductGallery({ images, alt, badge, overlay }: ProductGalleryProps) {
  const [index, setIndex] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const swipeLocked = useRef(false)

  const count = images.length
  const current = images[index] || images[0]

  const go = useCallback(
    (dir: -1 | 1) => {
      if (count < 2) return
      setIndex((i) => (i + dir + count) % count)
    },
    [count]
  )

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
    swipeLocked.current = false
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current || swipeLocked.current || count < 2) return
    const t = e.touches[0]
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y
    if (Math.abs(dx) < 40) return
    if (Math.abs(dx) <= Math.abs(dy)) return
    swipeLocked.current = true
    go(dx < 0 ? 1 : -1)
  }

  const onTouchEnd = () => {
    touchStart.current = null
    swipeLocked.current = false
  }

  useEffect(() => {
    if (!fullscreen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [fullscreen, go])

  if (!current) {
    return (
      <div className="flex aspect-square max-h-[min(58vh,560px)] w-full items-center justify-center rounded-md bg-surface-2 text-muted lg:aspect-auto lg:h-[min(52vh,520px)]">
        No image
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        <div
          className="group relative aspect-square max-h-[min(58vh,560px)] w-full touch-pan-y overflow-hidden rounded-md bg-surface-2 lg:aspect-auto lg:h-[min(52vh,520px)]"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <Image
            src={current}
            alt={alt}
            fill
            priority
            className="object-cover select-none"
            sizes="(max-width:1024px) 100vw, 50vw"
            draggable={false}
          />

          {badge}
          {overlay}

          {count > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={() => go(-1)}
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/55 p-2 text-white opacity-100 transition hover:bg-black/75 md:opacity-0 md:group-hover:opacity-100"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={() => go(1)}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/55 p-2 text-white opacity-100 transition hover:bg-black/75 md:opacity-0 md:group-hover:opacity-100"
              >
                <ChevronRight size={20} />
              </button>
              <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to image ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={`h-1.5 rounded-full transition ${
                      i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          <button
            type="button"
            aria-label="View fullscreen"
            onClick={() => setFullscreen(true)}
            className="absolute right-2 top-2 z-10 rounded-full border border-white/20 bg-black/55 p-2 text-white transition hover:bg-black/75"
          >
            <Maximize2 size={16} />
          </button>
        </div>

        {count > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, idx) => (
              <button
                key={img}
                type="button"
                onClick={() => setIndex(idx)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden border sm:h-20 sm:w-20 ${
                  idx === index ? 'border-accent' : 'border-border'
                }`}
              >
                <Image src={img} alt="" fill className="object-cover" sizes="80px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {fullscreen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen product image"
        >
          <div className="flex items-center justify-between px-4 py-3 text-white/80">
            <p className="text-sm tabular-nums">
              {index + 1} / {count}
            </p>
            <button
              type="button"
              aria-label="Close fullscreen"
              onClick={() => setFullscreen(false)}
              className="rounded-full border border-white/20 bg-white/10 p-2 hover:bg-white/20"
            >
              <X size={18} />
            </button>
          </div>

          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-6"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="relative h-full w-full max-w-5xl">
              <Image
                src={current}
                alt={alt}
                fill
                className="object-contain select-none"
                sizes="100vw"
                priority
                draggable={false}
              />
            </div>

            {count > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={() => go(-1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 p-3 text-white hover:bg-white/20 md:left-6"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={() => go(1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 p-3 text-white hover:bg-white/20 md:right-6"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
