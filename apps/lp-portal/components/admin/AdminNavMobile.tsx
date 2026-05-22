'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

const NAV_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/portfolio', label: 'Portfolio' },
  { href: '/admin/fund', label: 'Fund' },
  { href: '/admin/updates', label: 'Updates' },
]

export function AdminNavMobile() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 h-14 bg-canvas border-b border-border-hairline md:hidden">
      <div className="flex h-full items-center justify-between px-4">
        {/* Logo */}
        <Link href="/admin" aria-label="New Era Ventures admin — home">
          <Logo className="h-9 w-auto text-ink-primary" />
        </Link>

        {/* Hamburger button */}
        <button
          type="button"
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={open}
          aria-controls="admin-mobile-nav-sheet"
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-11 w-11 items-center justify-center text-ink-primary"
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M3 5h14a1 1 0 110 2H3a1 1 0 010-2zm0 4h14a1 1 0 110 2H3a1 1 0 010-2zm0 4h14a1 1 0 110 2H3a1 1 0 010-2z" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-14 z-40"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <nav
            id="admin-mobile-nav-sheet"
            className="absolute left-0 right-0 top-full z-50 bg-canvas border-b border-border-hairline animate-slide-down"
          >
            <ul className="flex flex-col py-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex h-12 items-center px-4 text-body font-inter text-ink-primary hover:bg-surface-warm transition-colors duration-200 ease-out"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            {/* Admin badge in sheet */}
            <div className="px-4 py-3 border-t border-border-hairline">
              <span className="inline-flex items-center rounded-pill bg-pill-peach-bg px-2.5 py-1 font-inter text-caption text-pill-peach-ink">
                Admin
              </span>
            </div>
          </nav>
        </>
      )}
    </header>
  )
}
