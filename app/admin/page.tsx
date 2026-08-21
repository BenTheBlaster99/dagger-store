'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Loader2,
  RefreshCw,
  Users,
  MousePointerClick,
  ShoppingBag,
  Percent,
  Activity,
  ArrowUpRight,
} from 'lucide-react'
import { AdminShell } from '@/components/AdminNav'

type Analytics = {
  live: number
  sessionsToday: number
  sessionsWeek: number
  ordersToday: number
  ordersWeek: number
  revenueToday: number
  revenueWeek: number
  conversionRateToday: number
  ordersByDay: Array<{ day: string; orders: number; revenue: number }>
  sessionsByDay: Array<{ day: string; sessions: number }>
  statusCounts: Record<string, number>
  generatedAt: string
}

function BarChart({
  title,
  data,
  valueKey,
  color = '#e5525f',
}: {
  title: string
  data: Array<Record<string, string | number>>
  valueKey: string
  color?: string
}) {
  const max = Math.max(1, ...data.map((d) => Number(d[valueKey] || 0)))

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{title}</h3>
      <div className="mt-6 flex h-44 items-end gap-2">
        {data.map((d) => {
          const value = Number(d[valueKey] || 0)
          const height = Math.max(6, Math.round((value / max) * 100))
          const label = String(d.day).slice(5)
          return (
            <div
              key={String(d.day)}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
            >
              <span className="text-[10px] tabular-nums text-zinc-500">{value}</span>
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: `${height}%`,
                  minHeight: 6,
                  background: `linear-gradient(180deg, ${color}, ${color}55)`,
                }}
                title={`${d.day}: ${value}`}
              />
              <span className="text-[10px] text-zinc-600">{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  live,
}: {
  label: string
  value: string | number
  hint?: string
  icon: typeof Users
  live?: boolean
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{label}</p>
          <p className="mt-3 font-editorial text-3xl tracking-wide text-white md:text-4xl">
            {value}
          </p>
          {hint ? <p className="mt-2 text-xs text-zinc-500">{hint}</p> : null}
        </div>
        <div
          className={`rounded-xl border border-white/10 p-2.5 ${
            live ? 'text-emerald-400' : 'text-zinc-400'
          }`}
        >
          <Icon size={18} />
        </div>
      </div>
      {live ? (
        <span className="absolute right-4 top-4 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-emerald-400" />
          Live
        </span>
      ) : null}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/analytics')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load')
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = window.setInterval(load, 30_000)
    return () => window.clearInterval(id)
  }, [load])

  const statusEntries = Object.entries(data?.statusCounts || {}).sort(
    (a, b) => b[1] - a[1]
  )

  return (
    <AdminShell
      title="Overview"
      subtitle={
        data
          ? `Synced ${new Date(data.generatedAt).toLocaleTimeString('en-GB')}`
          : 'Live store pulse'
      }
      actions={
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      }
    >
      {error && (
        <div className="mb-4 rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm text-brand">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center gap-2 py-24 text-zinc-500">
          <Loader2 className="animate-spin" size={18} />
          Loading analytics…
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <StatCard
              label="Live now"
              value={data.live}
              hint="Active in last 2 min"
              icon={Users}
              live
            />
            <StatCard
              label="Sessions today"
              value={data.sessionsToday}
              hint={`${data.sessionsWeek} this week`}
              icon={MousePointerClick}
            />
            <StatCard
              label="Orders today"
              value={data.ordersToday}
              hint={`${data.revenueToday.toLocaleString()} DA`}
              icon={ShoppingBag}
            />
            <StatCard
              label="Conversion"
              value={`${data.conversionRateToday}%`}
              hint="Orders ÷ sessions"
              icon={Percent}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <BarChart title="Orders · 7 days" data={data.ordersByDay} valueKey="orders" />
            <BarChart
              title="Sessions · 7 days"
              data={data.sessionsByDay}
              valueKey="sessions"
              color="#a3a3a3"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Revenue · 7 days
                </h3>
                <Activity size={14} className="text-zinc-600" />
              </div>
              <p className="mt-4 font-editorial text-4xl text-white">
                {data.revenueWeek.toLocaleString()}
                <span className="ml-2 text-sm font-normal text-zinc-500">DA</span>
              </p>
              <div className="mt-6 flex h-28 items-end gap-2">
                {data.ordersByDay.map((d) => {
                  const max = Math.max(1, ...data.ordersByDay.map((x) => x.revenue))
                  const height = Math.max(4, Math.round((d.revenue / max) * 100))
                  return (
                    <div
                      key={d.day}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                    >
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-white/10 to-white/40"
                        style={{ height: `${height}%`, minHeight: 4 }}
                        title={`${d.day}: ${d.revenue} DA`}
                      />
                      <span className="text-[10px] text-zinc-600">{d.day.slice(5)}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Order status · 7 days
              </h3>
              {statusEntries.length === 0 ? (
                <p className="mt-6 text-sm text-zinc-500">No orders yet.</p>
              ) : (
                <div className="mt-5 space-y-3">
                  {statusEntries.map(([status, count]) => {
                    const max = statusEntries[0][1] || 1
                    const pct = Math.round((count / max) * 100)
                    return (
                      <div key={status} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="capitalize text-zinc-300">{status}</span>
                          <span className="tabular-nums text-zinc-500">{count}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-brand"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { href: '/admin/orders', label: 'Manage orders', hint: 'Fulfill & status' },
              { href: '/admin/abandoned', label: 'Abandoned', hint: 'Partial checkouts' },
              { href: '/admin/products', label: 'Catalog', hint: 'Stock & pricing' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 transition hover:border-brand/40 hover:bg-brand/5"
              >
                <div>
                  <p className="font-medium text-white">{item.label}</p>
                  <p className="text-xs text-zinc-500">{item.hint}</p>
                </div>
                <ArrowUpRight
                  size={16}
                  className="text-zinc-600 transition group-hover:text-brand"
                />
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </AdminShell>
  )
}
