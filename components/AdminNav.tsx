'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, LogOut, Package, ShoppingBag } from 'lucide-react'

export function AdminNav({ subtitle }: { subtitle?: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/admin/login')
    router.refresh()
  }

  const linkClass = (href: string) => {
    const active =
      href === '/admin'
        ? pathname === '/admin'
        : pathname === href || pathname.startsWith(`${href}/`)
    return `px-3 py-1.5 text-sm border whitespace-nowrap ${
      active
        ? 'bg-black text-white border-black'
        : 'bg-white border-neutral-300 text-neutral-700'
    }`
  }

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Dagger Admin</h1>
          {subtitle ? <p className="text-xs text-neutral-500">{subtitle}</p> : null}
        </div>
        <button
          onClick={logout}
          className="p-2 border border-neutral-300 hover:bg-neutral-100"
          aria-label="Log out"
        >
          <LogOut size={16} />
        </button>
      </div>
      <div className="max-w-6xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
        <Link href="/admin" className={linkClass('/admin')}>
          <span className="inline-flex items-center gap-1.5">
            <LayoutDashboard size={14} /> Overview
          </span>
        </Link>
        <Link href="/admin/orders" className={linkClass('/admin/orders')}>
          <span className="inline-flex items-center gap-1.5">
            <ShoppingBag size={14} /> Orders
          </span>
        </Link>
        <Link href="/admin/products" className={linkClass('/admin/products')}>
          <span className="inline-flex items-center gap-1.5">
            <Package size={14} /> Products
          </span>
        </Link>
      </div>
    </header>
  )
}
