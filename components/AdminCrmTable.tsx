'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, Loader2, RefreshCw, Search } from 'lucide-react'
import { AdminShell } from '@/components/AdminNav'
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

  const isLive = (lead: Lead) => Boolean(lead.external_id?.startsWith('live:'))

  return (
    <AdminShell
      title={title}
      subtitle={`${total} ${subtitle}`}
      actions={
        <>
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, phone, city…"
              className="w-52 rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-brand/50"
            />
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            type="button"
            onClick={exportExcel}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-ink hover:bg-accent/90"
          >
            <Download size={14} /> Excel
          </button>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm text-brand">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-zinc-500">
          <Loader2 className="animate-spin" size={18} /> Loading…
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-20 text-center text-zinc-500">
          No records found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">City</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-white/5 transition hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-zinc-500">
                      <div className="flex items-center gap-2">
                        {lead.occurred_at
                          ? new Date(lead.occurred_at).toLocaleString('en-GB')
                          : '—'}
                        {source === 'abandoned' && isLive(lead) ? (
                          <span className="rounded-full bg-brand/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand">
                            Live
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-100">
                      {lead.customer_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-300" dir="ltr">
                      {lead.phone || '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{lead.city || '—'}</td>
                    <td className="px-4 py-3 text-zinc-300">{lead.product_title || '—'}</td>
                    <td className="px-4 py-3 tabular-nums text-zinc-400">
                      {lead.quantity ?? 1}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-zinc-200">
                      {Number(lead.total_price || 0).toLocaleString()} DA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
