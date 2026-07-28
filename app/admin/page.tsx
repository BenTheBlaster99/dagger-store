'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, Users, MousePointerClick, ShoppingBag, Percent } from 'lucide-react'
import { AdminNav } from '@/components/AdminNav'

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
  color = '#111',
}: {
  title: string
  data: Array<Record<string, string | number>>
  valueKey: string
  color?: string
}) {
  const max = Math.max(1, ...data.map((d) => Number(d[valueKey] || 0)))

  return (
    <div className="bg-white border border-neutral-200 p-4 space-y-3">
      {title ? <h3 className="text-sm font-semibold">{title}</h3> : null}
      <div className="flex items-end gap-2 h-40">
        {data.map((d) => {
          const value = Number(d[valueKey] || 0)
          const height = Math.max(4, Math.round((value / max) * 100))
          const label = String(d.day).slice(5)
          return (
            <div key={String(d.day)} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className="text-[10px] text-neutral-500">{value}</span>
              <div
                className="w-full rounded-t"
                style={{ height: `${height}%`, backgroundColor: color, minHeight: 4 }}
                title={`${d.day}: ${value}`}
              />
              <span className="text-[10px] text-neutral-400">{label}</span>
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
  accent,
}: {
  label: string
  value: string | number
  hint?: string
  icon: typeof Users
  accent?: string
}) {
  return (
    <div className="bg-white border border-neutral-200 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-neutral-500">{label}</p>
        <Icon size={16} className={accent || 'text-neutral-400'} />
      </div>
      <p className="text-3xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="text-xs text-neutral-500">{hint}</p> : null}
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
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <AdminNav
        subtitle={
          data
            ? `Updated ${new Date(data.generatedAt).toLocaleTimeString('en-GB')}`
            : 'Store analytics'
        }
      />

      <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        <div className="flex justify-end">
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-neutral-300 text-sm"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {error && (
          <div className="border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {loading && !data ? (
          <div className="py-20 flex items-center justify-center gap-2 text-neutral-500">
            <Loader2 className="animate-spin" size={18} />
            Loading analytics…
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                label="Live now"
                value={data.live}
                hint="Active in last 2 min"
                icon={Users}
                accent="text-emerald-600"
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
                hint="Orders ÷ sessions today"
                icon={Percent}
                accent="text-[#E5525F]"
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-3">
              <BarChart
                title="Orders (7 days)"
                data={data.ordersByDay}
                valueKey="orders"
                color="#111111"
              />
              <BarChart
                title="Sessions (7 days)"
                data={data.sessionsByDay}
                valueKey="sessions"
                color="#E5525F"
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-3">
              <div className="bg-white border border-neutral-200 p-4 space-y-3">
                <h3 className="text-sm font-semibold">Revenue (7 days)</h3>
                <p className="text-3xl font-semibold">
                  {data.revenueWeek.toLocaleString()}{' '}
                  <span className="text-sm font-normal text-neutral-500">DA</span>
                </p>
                <div className="flex items-end gap-2 h-32">
                  {data.ordersByDay.map((d) => {
                    const max = Math.max(1, ...data.ordersByDay.map((x) => x.revenue))
                    const height = Math.max(4, Math.round((d.revenue / max) * 100))
                    return (
                      <div key={d.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <div
                          className="w-full bg-neutral-700 rounded-t"
                          style={{ height: `${height}%`, minHeight: 4 }}
                          title={`${d.day}: ${d.revenue} DA`}
                        />
                        <span className="text-[10px] text-neutral-400">{d.day.slice(5)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-white border border-neutral-200 p-4 space-y-3">
                <h3 className="text-sm font-semibold">Order status (7 days)</h3>
                {statusEntries.length === 0 ? (
                  <p className="text-sm text-neutral-500">No orders yet.</p>
                ) : (
                  <div className="space-y-2">
                    {statusEntries.map(([status, count]) => {
                      const max = statusEntries[0][1] || 1
                      const pct = Math.round((count / max) * 100)
                      return (
                        <div key={status} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="capitalize">{status}</span>
                            <span>{count}</span>
                          </div>
                          <div className="h-2 bg-neutral-100">
                            <div
                              className="h-2 bg-black"
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
          </>
        ) : null}
      </div>
    </main>
  )
}
