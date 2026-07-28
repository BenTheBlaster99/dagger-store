'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const SESSION_KEY = 'dagger_sid'
const LIVE_MS = 30_000

function getOrCreateSessionId() {
  try {
    let id = localStorage.getItem(SESSION_KEY)
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`
      localStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return `s_${Date.now()}`
  }
}

async function send(payload: Record<string, unknown>) {
  try {
    await fetch('/api/analytics/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    })
  } catch {
    // ignore
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastPath = useRef('')

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return

    const sessionId = getOrCreateSessionId()
    const path =
      pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')

    const isNewPage = lastPath.current !== path
    lastPath.current = path

    send({
      session_id: sessionId,
      path,
      referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      heartbeat: !isNewPage,
      pageview: isNewPage,
    })

    const interval = window.setInterval(() => {
      send({
        session_id: sessionId,
        path,
        heartbeat: true,
        pageview: false,
      })
    }, LIVE_MS)

    return () => window.clearInterval(interval)
  }, [pathname, searchParams])

  return null
}
