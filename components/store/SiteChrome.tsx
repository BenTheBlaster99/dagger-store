'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X, Instagram, Mail } from 'lucide-react'

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/sale', label: 'Sale' },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-10 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <button
          type="button"
          className="p-2 text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link href="/" className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
          <Image
            src="/daggerLogo.avif"
            alt="The Dagger"
            width={150}
            height={56}
            className="h-11 w-auto object-contain md:h-12"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-display text-lg tracking-[0.18em] text-foreground/85 transition-colors hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-foreground/80">
          <a
            href="https://www.instagram.com/dagger.ac/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="hidden transition-colors hover:text-brand sm:block"
          >
            <Instagram size={18} />
          </a>
          <a
            href="mailto:dagger.ac.pro@gmail.com"
            aria-label="Email"
            className="transition-colors hover:text-brand"
          >
            <Mail size={18} />
          </a>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-surface md:hidden">
          <nav className="flex flex-col px-4 py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="font-display py-3 text-xl tracking-[0.16em] text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}

export function SiteMarquee() {
  const items = [
    'LIMITED DROPS',
    'BORN IN SHADOWS',
    'WORN IN LIGHT',
    'DAGGER.AC',
    'STREETWEAR ALGERIA',
    'NEW ARRIVALS',
  ]
  const loop = [...items, ...items]

  return (
    <div className="sticky top-0 z-[60] overflow-hidden bg-accent text-accent-ink">
      <div className="animate-marquee flex w-max whitespace-nowrap py-2.5">
        {loop.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="font-display px-6 text-sm tracking-[0.22em] md:text-base"
          >
            {item}
            <span className="mx-6 text-brand">◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
        <div className="space-y-3 md:col-span-1">
          <p className="font-display text-2xl tracking-[0.14em]">THE DAGGER</p>
          <p className="text-sm leading-relaxed text-muted">
            Premium streetwear from the shadows. Limited stock. Built to be worn in the light.
          </p>
        </div>
        <div>
          <p className="font-display mb-3 text-lg tracking-[0.16em]">Shop</p>
          <div className="flex flex-col gap-2 text-sm text-muted">
            <Link href="/shop" className="hover:text-foreground">
              All Products
            </Link>
            <Link href="/sale" className="hover:text-foreground">
              Sale
            </Link>
            <Link href="/shop?category=Hoodie" className="hover:text-foreground">
              Hoodies
            </Link>
            <Link href="/shop?category=T-Shirt" className="hover:text-foreground">
              T-Shirts
            </Link>
          </div>
        </div>
        <div>
          <p className="font-display mb-3 text-lg tracking-[0.16em]">Connect</p>
          <div className="flex flex-col gap-2 text-sm text-muted">
            <a
              href="https://www.instagram.com/dagger.ac/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              Instagram
            </a>
            <a
              href="https://www.tiktok.com/@dagger.ac"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              TikTok
            </a>
            <a href="mailto:dagger.ac.pro@gmail.com" className="hover:text-foreground">
              dagger.ac.pro@gmail.com
            </a>
          </div>
        </div>
        <div>
          <p className="font-display mb-3 text-lg tracking-[0.16em]">Drop Alerts</p>
          <p className="mb-3 text-sm text-muted">
            Follow the page — new drops hit Instagram first.
          </p>
          <a
            href="https://www.instagram.com/dagger.ac/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:bg-accent/90"
          >
            Follow @dagger.ac
          </a>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} The Dagger. All rights reserved.
      </div>
    </footer>
  )
}
