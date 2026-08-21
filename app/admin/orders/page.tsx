'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Download,
  Loader2,
  Ban,
  RefreshCw,
} from 'lucide-react'
import { AdminShell } from '@/components/AdminNav'

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'delivered'
  | 'cancelled'
  | 'declined'
  | 'returned'

type OrderItem = {
  quantity?: number
  size?: string | null
  color?: string | null
  product_id?: string
}

type Order = {
  id: string
  customer_name: string
  phone: string
  address: string
  wilaya: string
  commune: string
  notes?: string | null
  delivery_method?: string
  total_price: number
  status: OrderStatus
  size?: string | null
  color?: string | null
  created_at: string
  is_banned?: boolean
  order_items?: OrderItem[]
}

type Ban = {
  phone: string
  name?: string | null
  reason?: string | null
  created_at: string
}

const STATUS_FILTERS: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Ordered' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'declined', label: 'Declined' },
  { id: 'returned', label: 'Returned' },
  { id: 'banned', label: 'Banned' },
]

const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'delivered',
  'cancelled',
  'declined',
  'returned',
]

function formatAddress(order: Order) {
  return [order.address, order.commune, order.wilaya].filter(Boolean).join(', ')
}

function productSummary(order: Order) {
  const item = order.order_items?.[0]
  const qty = item?.quantity ?? 1
  const size = item?.size || order.size || '-'
  const color = item?.color || order.color || '-'
  return `qty ${qty} · ${size} · ${color}`
}

export default function AdminPage() {
  const [filter, setFilter] = useState('all')
  const [orders, setOrders] = useState<Order[]>([])
  const [bans, setBans] = useState<Ban[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (filter === 'banned') {
        params.set('banned', '1')
      } else if (filter !== 'all') {
        params.set('status', filter)
      }

      const res = await fetch(`/api/admin/orders?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setOrders(data.orders || [])
      setBans(data.bans || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  const bannedCount = useMemo(() => bans.length, [bans])

  async function updateStatus(id: string, status: OrderStatus) {
    setBusyId(id)
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setBusyId(null)
    }
  }

  async function banCustomer(order: Order) {
    const reason = window.prompt('Ban reason (optional):', '') ?? ''
    setBusyId(order.id)
    try {
      const res = await fetch('/api/admin/bans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: order.phone,
          name: order.customer_name,
          reason: reason || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ban failed')
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ban failed')
    } finally {
      setBusyId(null)
    }
  }

  async function unbanCustomer(phone: string, orderId: string) {
    setBusyId(orderId)
    try {
      const res = await fetch(`/api/admin/bans?phone=${encodeURIComponent(phone)}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unban failed')
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unban failed')
    } finally {
      setBusyId(null)
    }
  }

  function exportExcel() {
    const params = new URLSearchParams()
    if (filter === 'banned') {
      params.set('banned', '1')
    } else if (filter !== 'all') {
      params.set('status', filter)
    }
    window.location.href = `/api/admin/export?${params.toString()}`
  }

  return (
    <AdminShell
      title="Orders"
      subtitle={`${orders.length} shown · ${bannedCount} banned phones`}
      actions={
        <>
          <button
            type="button"
            onClick={load}
            className="rounded-lg border border-white/15 bg-white/5 p-2 text-zinc-300 hover:bg-white/10"
            aria-label="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button
            type="button"
            onClick={exportExcel}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-ink"
          >
            <Download size={14} />
            Excel
          </button>
        </>
      }
    >
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition ${
              filter === item.id
                ? 'bg-brand text-white'
                : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm text-brand">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-zinc-500">
          <Loader2 className="animate-spin" size={18} />
          Loading customers…
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-20 text-center text-zinc-500">
          No customers for this filter.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const busy = busyId === order.id
            return (
              <article
                key={order.id}
                className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-editorial text-xl text-white">{order.customer_name}</h2>
                    <p className="mt-1 text-sm text-zinc-400" dir="ltr">
                      {order.phone}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-lg font-semibold tabular-nums text-white">
                      {Number(order.total_price).toLocaleString()} DA
                    </p>
                    <p className="text-zinc-500">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleString('en-GB')
                        : '—'}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-zinc-400">{formatAddress(order)}</p>
                <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-600">
                  {productSummary(order)}
                  {order.is_banned ? ' · BANNED' : ''}
                </p>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="text-xs text-zinc-500 sm:mr-1">Status</label>
                  <select
                    value={order.status}
                    disabled={busy}
                    onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                    className="rounded-lg border border-white/15 bg-[#121212] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-brand/50"
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  {order.is_banned ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => unbanCustomer(order.phone, order.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-zinc-300"
                    >
                      Unban
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => banCustomer(order)}
                      className="inline-flex items-center gap-1 rounded-lg border border-brand/40 px-3 py-1.5 text-sm text-brand"
                    >
                      <Ban size={14} />
                      Ban
                    </button>
                  )}

                  {busy && <Loader2 size={16} className="animate-spin text-zinc-500" />}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </AdminShell>
  )
}
