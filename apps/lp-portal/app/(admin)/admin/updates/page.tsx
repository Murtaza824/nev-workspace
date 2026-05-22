import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/format'
import type { Update, PortfolioCompany } from '@/lib/types'

export default async function AdminUpdatesPage() {
  const adminSupabase = createAdminClient()

  const [updatesResult, companiesResult] = await Promise.all([
    adminSupabase
      .from('updates')
      .select('*')
      .order('created_at', { ascending: false }),
    adminSupabase
      .from('portfolio_companies')
      .select('id, name')
      .order('name'),
  ])

  const updates = (updatesResult.data ?? []) as Update[]
  const companies = (companiesResult.data ?? []) as Pick<PortfolioCompany, 'id' | 'name'>[]

  const companyMap: Record<string, string> = {}
  for (const c of companies) {
    companyMap[c.id] = c.name
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 animate-fade-up">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-fraunces text-display-2-mobile md:text-display-2 text-ink-primary mb-1">
            Updates
          </h1>
          <p className="font-inter text-body text-ink-secondary">
            {updates.length} {updates.length === 1 ? 'update' : 'updates'}
          </p>
        </div>
        <Link
          href="/admin/updates/new"
          className="inline-flex items-center rounded-pill bg-surface-warm border border-border-hairline px-4 py-2 font-inter text-body text-ink-primary hover:border-white/20 transition-colors duration-200 shrink-0"
        >
          New update
        </Link>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border-hairline">
              {['Title', 'Status', 'Published', 'Related company'].map((h) => (
                <th
                  key={h}
                  className="py-3 pr-6 text-left font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {updates.map((update) => (
              <tr
                key={update.id}
                className="border-b border-border-hairline hover:bg-surface-warm/50 transition-colors duration-200"
              >
                <td className="py-4 pr-6">
                  <Link
                    href={`/admin/updates/${update.slug}`}
                    className="font-inter text-body text-ink-primary hover:text-accent-positive transition-colors duration-200"
                  >
                    {update.title}
                  </Link>
                </td>
                <td className="py-4 pr-6">
                  <UpdateStatusPill status={update.status} />
                </td>
                <td className="py-4 pr-6 font-mono text-mono-sm text-ink-secondary">
                  {update.published_at ? formatDate(update.published_at) : '—'}
                </td>
                <td className="py-4 font-inter text-body text-ink-secondary">
                  {update.related_company_id ? companyMap[update.related_company_id] ?? '—' : '—'}
                </td>
              </tr>
            ))}
            {updates.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center font-inter text-body text-ink-secondary">
                  No updates yet. Write the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="block md:hidden">
        <ul className="flex flex-col gap-3">
          {updates.map((update) => (
            <li key={update.id}>
              <Link
                href={`/admin/updates/${update.slug}`}
                className="block rounded-card border border-border-hairline bg-surface p-4 hover:shadow-card-hover transition-shadow duration-200"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-inter text-body text-ink-primary">{update.title}</p>
                  <UpdateStatusPill status={update.status} />
                </div>
                {update.published_at && (
                  <p className="font-mono text-mono-sm text-ink-tertiary">
                    {formatDate(update.published_at)}
                  </p>
                )}
              </Link>
            </li>
          ))}
          {updates.length === 0 && (
            <li className="py-12 text-center font-inter text-body text-ink-secondary">
              No updates yet.
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

function UpdateStatusPill({ status }: { status: Update['status'] }) {
  if (status === 'published') {
    return (
      <span className="inline-flex items-center rounded-pill bg-pill-mint-bg px-2.5 py-1 font-inter text-caption text-pill-mint-ink">
        Published
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-pill bg-pill-slate-bg px-2.5 py-1 font-inter text-caption text-pill-slate-ink">
      Draft
    </span>
  )
}
