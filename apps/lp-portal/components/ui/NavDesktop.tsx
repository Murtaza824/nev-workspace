'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/updates', label: 'Updates' },
]

export function NavDesktop({ initials }: { initials: string }) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 hidden h-16 bg-canvas border-b border-border-hairline md:block">
      <div className="flex items-center h-full max-w-7xl mx-auto px-8">
        {/* Logo, far left */}
        <Link href="/dashboard" aria-label="New Era Ventures — home" className="shrink-0">
          <Logo className="h-9 w-auto text-ink-primary" />
        </Link>

        {/* Nav links, centered in remaining space */}
        <nav aria-label="Main navigation" className="flex-1 flex items-center justify-center gap-8">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  'text-body font-inter transition-colors duration-200 ease-out',
                  isActive
                    ? 'text-ink-primary'
                    : 'text-ink-secondary hover:text-ink-primary',
                ].join(' ')}
                aria-current={isActive ? 'page' : undefined}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Avatar — links to account */}
        <Link
          href="/account"
          className="h-8 w-8 rounded-full bg-surface-warm border border-border-hairline shrink-0 flex items-center justify-center font-inter text-[11px] font-medium text-ink-secondary hover:text-ink-primary hover:border-white/30 transition-colors"
          aria-label="Your account"
        >
          {initials}
        </Link>
      </div>
    </header>
  )
}
