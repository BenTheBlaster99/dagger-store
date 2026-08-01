'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBag,
  Users,
  UserX,
} from 'lucide-react'

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
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold">Dagger Admin</h1>
          {subtitle ? <p className="text-xs text-neutral-500">{subtitle}</p> : null}
        </div>
        <button
          onClick={logout}
          className="border border-neutral-300 p-2 hover:bg-neutral-100"
          aria-label="Log out"
        >
          <LogOut size={16} />
        </button>
      </div>
      <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3">
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
        <Link href="/admin/clients" className={linkClass('/admin/clients')}>
          <span className="inline-flex items-center gap-1.5">
            <Users size={14} /> Clients
          </span>
        </Link>
        <Link href="/admin/abandoned" className={linkClass('/admin/abandoned')}>
          <span className="inline-flex items-center gap-1.5">
            <UserX size={14} /> Abandoned
          </span>
        </Link>
      </div>
    </header>
  )
}
