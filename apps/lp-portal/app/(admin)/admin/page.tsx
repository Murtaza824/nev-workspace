import Link from 'next/link'

const SECTIONS = [
  {
    href: '/admin/users',
    title: 'Users',
    description: 'Invite LPs, manage commitments, and view login activity.',
  },
  {
    href: '/admin/portfolio',
    title: 'Portfolio',
    description: 'Add or edit portfolio companies, log valuations, and manage co-investors.',
  },
  {
    href: '/admin/fund',
    title: 'Fund',
    description: 'Update Fund I metrics — committed capital, called capital, and current value.',
  },
  {
    href: '/admin/updates',
    title: 'Updates',
    description: 'Draft and publish GP updates visible to all limited partners.',
  },
]

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 animate-fade-up">
      <div className="mb-10">
        <h1 className="font-fraunces text-display-2-mobile md:text-display-2 text-ink-primary mb-2">
          Admin
        </h1>
        <p className="font-inter text-body text-ink-secondary">
          New Era Ventures — Fund I management
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group block rounded-card border border-border-hairline bg-surface p-6 transition-shadow duration-200 hover:shadow-card-hover"
          >
            <h2 className="font-fraunces text-heading text-ink-primary mb-2 group-hover:text-ink-primary">
              {section.title}
            </h2>
            <p className="font-inter text-body text-ink-secondary">
              {section.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
