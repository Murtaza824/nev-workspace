import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

const NAV_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/portfolio', label: 'Portfolio' },
  { href: '/admin/fund', label: 'Fund' },
  { href: '/admin/updates', label: 'Updates' },
]

export function AdminNavDesktop() {
  return (
    <header className="sticky top-0 z-50 hidden h-16 bg-canvas border-b border-border-hairline md:block">
      <div className="flex items-center h-full max-w-7xl mx-auto px-8">
        {/* Logo, far left */}
        <Link href="/admin" aria-label="New Era Ventures admin — home" className="shrink-0">
          <Logo className="h-9 w-auto text-ink-primary" />
        </Link>

        {/* Nav links, centered */}
        <nav aria-label="Admin navigation" className="flex-1 flex items-center justify-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-body font-inter text-ink-secondary hover:text-ink-primary transition-colors duration-200 ease-out"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Admin badge, far right */}
        <div className="shrink-0">
          <span className="inline-flex items-center rounded-pill bg-pill-peach-bg px-2.5 py-1 font-inter text-caption text-pill-peach-ink">
            Admin
          </span>
        </div>
      </div>
    </header>
  )
}
