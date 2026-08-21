'use client'

import { FormEvent, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Lock } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }
      const next = searchParams.get('next') || '/admin'
      router.replace(next)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a] p-4 text-zinc-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(229,82,95,0.18),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.04),transparent_45%)]"
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm space-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur"
      >
        <div>
          <p className="font-gothic text-3xl tracking-wide text-white">Dagger</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-zinc-500">
            Command center
          </p>
        </div>
        <p className="text-sm text-zinc-400">Owner access only.</p>
        <label className="block space-y-1.5">
          <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Password</span>
          <div className="relative">
            <Lock size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#121212] py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none focus:border-brand/50"
              required
              autoFocus
            />
          </div>
        </label>
        {error && <p className="text-sm text-brand">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-bold tracking-wide text-accent-ink transition hover:bg-accent/90 disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Sign in
        </button>
      </form>
    </main>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-zinc-500">
          <Loader2 className="animate-spin" />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
