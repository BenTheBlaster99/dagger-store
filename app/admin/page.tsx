'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Download,
  Loader2,
  LogOut,
  Ban,
  RefreshCw,
} from 'lucide-react'

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
  const router = useRouter()
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

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/admin/login')
    router.refresh()
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
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-20 bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Customer listing</h1>
            <p className="text-xs text-neutral-500">
              {orders.length} shown · {bannedCount} banned phones
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="p-2 border border-neutral-300 hover:bg-neutral-100"
              aria-label="Refresh"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={exportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-black text-white text-sm"
            >
              <Download size={14} />
              Excel
            </button>
            <button
              onClick={logout}
              className="p-2 border border-neutral-300 hover:bg-neutral-100"
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          {STATUS_FILTERS.map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-3 py-1.5 text-sm whitespace-nowrap border ${
                filter === item.id
                  ? 'bg-black text-white border-black'
                  : 'bg-white border-neutral-300 text-neutral-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4 space-y-3">
        {error && (
          <div className="border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 flex items-center justify-center text-neutral-500 gap-2">
            <Loader2 className="animate-spin" size={18} />
            Loading customers…
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center text-neutral-500">No customers for this filter.</div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const busy = busyId === order.id
              return (
                <article
                  key={order.id}
                  className="bg-white border border-neutral-200 p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold text-base">{order.customer_name}</h2>
                      <p className="text-sm text-neutral-600">{order.phone}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">
                        {Number(order.total_price).toLocaleString()} DA
                      </p>
                      <p className="text-neutral-500">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleString('en-GB')
                          : '—'}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-neutral-700">{formatAddress(order)}</p>
                  <p className="text-xs text-neutral-500 uppercase tracking-wide">
                    {productSummary(order)}
                    {order.is_banned ? ' · BANNED' : ''}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <label className="text-xs text-neutral-500 sm:mr-1">Status</label>
                    <select
                      value={order.status}
                      disabled={busy}
                      onChange={(e) =>
                        updateStatus(order.id, e.target.value as OrderStatus)
                      }
                      className="border border-neutral-300 px-2 py-1.5 text-sm bg-white"
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>

                    {order.is_banned ? (
                      <button
                        disabled={busy}
                        onClick={() => unbanCustomer(order.phone, order.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-neutral-300"
                      >
                        Unban
                      </button>
                    ) : (
                      <button
                        disabled={busy}
                        onClick={() => banCustomer(order)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-red-300 text-red-700"
                      >
                        <Ban size={14} />
                        Ban
                      </button>
                    )}

                    {busy && <Loader2 size={16} className="animate-spin text-neutral-400" />}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
