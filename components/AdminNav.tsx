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
  ExternalLink,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/abandoned', label: 'Abandoned', icon: UserX },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact || href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/admin/login')
    router.refresh()
  }

  const nav = (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(pathname, href, exact)
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
              active
                ? 'bg-brand/15 text-white shadow-[inset_3px_0_0_0_#e5525f]'
                : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
            }`}
          >
            <Icon
              size={16}
              className={active ? 'text-brand' : 'text-zinc-500 group-hover:text-zinc-300'}
            />
            <span className="font-medium tracking-wide">{label}</span>
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(229,82,95,0.12),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.04),transparent_40%)]"
      />

      <div className="relative flex min-h-screen w-full">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[#0e0e0e]/95 backdrop-blur lg:flex">
          <div className="border-b border-white/10 px-5 py-6">
            <p className="font-gothic text-2xl tracking-wide text-white">Dagger</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-zinc-500">
              Command center
            </p>
          </div>
          {nav}
          <div className="mt-auto space-y-2 border-t border-white/10 p-3">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"
            >
              <ExternalLink size={14} /> View storefront
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-500 transition hover:bg-brand/10 hover:text-brand"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#0e0e0e]/95 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-white/10 p-2 text-zinc-300"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <p className="font-gothic text-xl">Dagger</p>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-white/10 p-2 text-zinc-400"
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/70"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-white/10 bg-[#0e0e0e]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
                <p className="font-gothic text-xl">Dagger</p>
                <button type="button" onClick={() => setOpen(false)} className="p-2 text-zinc-400">
                  <X size={18} />
                </button>
              </div>
              {nav}
              <div className="mt-auto border-t border-white/10 p-3">
                <Link
                  href="/"
                  className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-500"
                  onClick={() => setOpen(false)}
                >
                  <ExternalLink size={14} /> Storefront
                </Link>
              </div>
            </aside>
          </div>
        )}

        <div className="relative flex min-w-0 flex-1 flex-col pt-14 lg:pt-0">
          {(title || subtitle || actions) && (
            <header className="sticky top-14 z-20 border-b border-white/10 bg-[#0a0a0a]/80 px-4 py-5 backdrop-blur lg:top-0 lg:px-8">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  {title ? (
                    <h1 className="font-editorial text-2xl tracking-wide text-white md:text-3xl">
                      {title}
                    </h1>
                  ) : null}
                  {subtitle ? (
                    <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
                  ) : null}
                </div>
                {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
              </div>
            </header>
          )}
          <div className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</div>
        </div>
      </div>
    </div>
  )
}

/** @deprecated use AdminShell — kept for gradual migration */
export function AdminNav({ subtitle }: { subtitle?: string }) {
  return (
    <AdminShell title="Admin" subtitle={subtitle}>
      {null}
    </AdminShell>
  )
}
