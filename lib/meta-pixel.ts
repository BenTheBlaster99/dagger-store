/**
 * Meta Pixel helpers.
 *
 * Test checklist:
 * 1. Set NEXT_PUBLIC_META_PIXEL_ID in .env.local / Vercel
 * 2. Install Chrome "Meta Pixel Helper"
 * 3. Open Events Manager → Test Events → enter your browser test code if needed
 * 4. Visit home → expect PageView
 * 5. Open checkout?product=... → expect ViewContent + InitiateCheckout
 * 6. Complete a test order → expect Purchase (value + DZD)
 */

export type PixelContent = {
  content_ids?: string[]
  content_name?: string
  content_type?: string
  value?: number
  currency?: string
  num_items?: number
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

function fbq(...args: unknown[]) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  window.fbq(...args)
}

export function trackPageView() {
  fbq('track', 'PageView')
}

export function trackViewContent(data: PixelContent) {
  fbq('track', 'ViewContent', {
    content_ids: data.content_ids,
    content_name: data.content_name,
    content_type: data.content_type || 'product',
    value: data.value,
    currency: data.currency || 'DZD',
  })
}

export function trackInitiateCheckout(data: PixelContent) {
  fbq('track', 'InitiateCheckout', {
    content_ids: data.content_ids,
    content_name: data.content_name,
    content_type: data.content_type || 'product',
    value: data.value,
    currency: data.currency || 'DZD',
    num_items: data.num_items,
  })
}

export function trackPurchase(data: PixelContent & { value: number }) {
  fbq('track', 'Purchase', {
    content_ids: data.content_ids,
    content_name: data.content_name,
    content_type: data.content_type || 'product',
    value: data.value,
    currency: data.currency || 'DZD',
    num_items: data.num_items,
  })
}
