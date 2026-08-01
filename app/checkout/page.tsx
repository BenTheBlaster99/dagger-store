'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function CheckoutRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productId = searchParams.get('product')
  const size = searchParams.get('size')
  const color = searchParams.get('color')

  useEffect(() => {
    if (!productId) {
      router.replace('/shop')
      return
    }
    const qs = new URLSearchParams()
    if (size) qs.set('size', size)
    if (color) qs.set('color', color)
    const hash = '#order-form'
    const query = qs.toString()
    router.replace(`/product/${productId}${query ? `?${query}` : ''}${hash}`)
  }, [productId, size, color, router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-muted">
      <Loader2 className="animate-spin" />
    </main>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background text-muted">
          <Loader2 className="animate-spin" />
        </main>
      }
    >
      <CheckoutRedirect />
    </Suspense>
  )
}
