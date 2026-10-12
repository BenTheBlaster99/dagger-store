'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, TicketPercent, X } from 'lucide-react'

type Promo = {
  code: string | null
  discountDa: number | null
  expiresAt: string | null
  active: boolean
}

function formatLeft(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export function ProductPromoPanel() {
  const [promo, setPromo] = useState<Promo | null>(null)
  const [code, setCode] = useState('')
  const [amount, setAmount] = useState('300')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(() => Date.now())

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/promo')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load promo')
      setPromo(data)
      if (data.code) setCode(data.code)
      if (data.discountDa) setAmount(String(data.discountDa))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load promo')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const left = promo?.expiresAt ? new Date(promo.expiresAt).getTime() - now : 0
  const live = Boolean(promo?.active && left > 0)

  async function send(body: Record<string, unknown>) {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/admin/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setPromo(data)
      if (data.code) setCode(data.code)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  function onSave(e: FormEvent) {
    e.preventDefault()
    send({ action: 'set', code, discount_da: Number(amount) })
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-zinc-200">
          <TicketPercent size={16} />
          <h2 className="text-sm font-medium">Promo code</h2>
        </div>
        <p className="text-xs text-zinc-500">Separate from sale price. Runs 3 hours, then stops.</p>
      </div>

      {error && <p className="mb-3 text-sm text-brand">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-zinc-500">
          <Loader2 className="animate-spin" size={16} /> Loading promo…
        </div>
      ) : (
        <form onSubmit={onSave} className="grid gap-3 lg:grid-cols-[1fr_140px_auto] lg:items-end">
          <label className="space-y-1 text-sm">
            <span className="text-xs uppercase text-zinc-500">Code</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="DAGGER10"
              className="w-full rounded-lg border border-white/15 bg-[#121212] px-3 py-2 uppercase tracking-[0.12em] text-zinc-100 outline-none focus:border-brand/50"
              required
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs uppercase text-zinc-500">Off (DA)</span>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#121212] px-3 py-2 text-zinc-100 outline-none focus:border-brand/50"
              required
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink disabled:opacity-60"
          >
            {busy ? 'Saving…' : 'Start 3 hours'}
          </button>

          <div className="flex flex-wrap items-center gap-3 lg:col-span-3">
            {live && promo ? (
              <>
                <p className="font-mono text-lg tabular-nums text-emerald-400">{formatLeft(left)}</p>
                <p className="text-sm text-zinc-400">
                  {promo.code} · {promo.discountDa?.toLocaleString()} DA off until{' '}
                  {promo.expiresAt ? new Date(promo.expiresAt).toLocaleTimeString('en-GB') : ''}
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => send({ action: 'refresh' })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-200"
                >
                  <RefreshCw size={12} /> Refresh 3 hours
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => send({ action: 'clear' })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-brand/40 px-3 py-1.5 text-xs text-brand"
                >
                  <X size={12} /> End now
                </button>
              </>
            ) : (
              <p className="text-sm text-zinc-500">
                {promo?.code ? `${promo.code} has ended.` : 'No promo running.'}
              </p>
            )}
          </div>
        </form>
      )}
    </section>
  )
}
