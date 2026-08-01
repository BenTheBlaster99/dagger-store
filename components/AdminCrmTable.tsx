'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, Loader2, RefreshCw, Search } from 'lucide-react'
import { AdminNav } from '@/components/AdminNav'
import * as XLSX from 'xlsx'

type Lead = {
  id: string
  source: 'client' | 'abandoned'
  external_id?: string | null
  occurred_at?: string | null
  customer_name?: string | null
  city?: string | null
  address?: string | null
  phone?: string | null
  product_title?: string | null
  quantity?: number | null
  total_price?: number | null
}

export default function AdminCrmPage({
  source,
  title,
  subtitle,
}: {
  source: 'client' | 'abandoned'
  title: string
  subtitle: string
}) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ source })
      if (q.trim()) params.set('q', q.trim())
      const res = await fetch(`/api/admin/crm?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setLeads(data.leads || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [source, q])

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
  }, [load])

  function exportExcel() {
    const rows = leads.map((l) => ({
      Date: l.occurred_at ? new Date(l.occurred_at).toLocaleString('en-GB') : '',
      'Order / ID': l.external_id || '',
      Name: l.customer_name || '',
      Phone: l.phone || '',
      City: l.city || '',
      Address: l.address || '',
      Product: l.product_title || '',
      Qty: l.quantity || 1,
      Total: l.total_price || 0,
    }))
    const wb = XLSX.utils.book_new()
    const sheet = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, sheet, title)
    XLSX.writeFile(wb, `dagger-${source}-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <AdminNav subtitle={`${total} ${subtitle}`} />

      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, phone, city…"
                className="border border-neutral-300 bg-white py-2 pl-7 pr-3 text-sm"
              />
            </div>
            <button
              onClick={load}
              className="inline-flex items-center gap-1 border border-neutral-300 px-3 py-2 text-sm"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              onClick={exportExcel}
              className="inline-flex items-center gap-1 bg-black px-3 py-2 text-sm text-white"
            >
              <Download size={14} /> Excel
            </button>
          </div>
        </div>

        {error && (
          <div className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-neutral-500">
            <Loader2 className="animate-spin" size={18} /> Loading…
          </div>
        ) : leads.length === 0 ? (
          <p className="py-16 text-center text-neutral-500">No records found.</p>
        ) : (
          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">City</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-neutral-100">
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-neutral-500">
                      {lead.occurred_at
                        ? new Date(lead.occurred_at).toLocaleString('en-GB')
                        : '—'}
                    </td>
                    <td className="px-3 py-2 font-medium">{lead.customer_name || '—'}</td>
                    <td className="px-3 py-2" dir="ltr">
                      {lead.phone || '—'}
                    </td>
                    <td className="px-3 py-2">{lead.city || '—'}</td>
                    <td className="px-3 py-2">{lead.product_title || '—'}</td>
                    <td className="px-3 py-2">{lead.quantity ?? 1}</td>
                    <td className="px-3 py-2">
                      {Number(lead.total_price || 0).toLocaleString()} DA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
