'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/updates', label: 'Updates' },
  { href: '/account', label: 'Account' },
]

export function NavMobile({ initials }: { initials: string }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-50 h-14 bg-canvas border-b border-border-hairline md:hidden">
      <div className="flex h-full items-center justify-between px-4">
        {/* Logo */}
        <Link href="/dashboard" aria-label="New Era Ventures — home">
          <Logo className="h-9 w-auto text-ink-primary" />
        </Link>

        {/* Hamburger button */}
        <button
          type="button"
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={open}
          aria-controls="mobile-nav-sheet"
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-11 w-11 items-center justify-center text-ink-primary"
        >
          {open ? (
            /* Close icon */
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          ) : (
            /* Hamburger icon */
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M3 5h14a1 1 0 110 2H3a1 1 0 010-2zm0 4h14a1 1 0 110 2H3a1 1 0 010-2zm0 4h14a1 1 0 110 2H3a1 1 0 010-2z" />
            </svg>
          )}
        </button>
      </div>

      {/* Slide-down sheet */}
      {open && (
        <>
          {/* Backdrop — tap to close */}
          <div
            className="fixed inset-0 top-14 z-40"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <nav
            id="mobile-nav-sheet"
            className="absolute left-0 right-0 top-full z-50 bg-canvas border-b border-border-hairline animate-slide-down"
          >
            <ul className="flex flex-col py-2">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive ? 'page' : undefined}
                      className={[
                        'flex h-12 items-center px-4 text-body font-inter transition-colors duration-200 ease-out border-l-2',
                        isActive
                          ? 'text-ink-primary border-accent-positive bg-surface-warm'
                          : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-warm border-transparent',
                      ].join(' ')}
                    >
                      {link.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
            <div className="border-t border-border-hairline py-2">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex h-12 w-full items-center px-4 font-inter text-body text-ink-secondary hover:text-ink-primary hover:bg-surface-warm transition-colors duration-200 border-l-2 border-transparent"
              >
                Sign out
              </button>
            </div>
          </nav>
        </>
      )}
    </header>
  )
}
