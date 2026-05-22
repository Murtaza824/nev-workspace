import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { formatUSD, formatMult } from '@/lib/format'
import { StagePill } from '@/components/ui/StagePill'
import type { PortfolioCompany } from '@/lib/types'

export default async function AdminPortfolioPage() {
  const adminSupabase = createAdminClient()
  const { data } = await adminSupabase
    .from('portfolio_companies')
    .select('*')
    .order('invested_date', { ascending: false })

  const companies = (data ?? []) as PortfolioCompany[]

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 animate-fade-up">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-fraunces text-display-2-mobile md:text-display-2 text-ink-primary mb-1">
            Portfolio
          </h1>
          <p className="font-inter text-body text-ink-secondary">
            {companies.length} {companies.length === 1 ? 'company' : 'companies'}
          </p>
        </div>
        <Link
          href="/admin/portfolio/new"
          className="inline-flex items-center rounded-pill bg-surface-warm border border-border-hairline px-4 py-2 font-inter text-body text-ink-primary hover:border-white/20 transition-colors duration-200 shrink-0"
        >
          Add company
        </Link>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border-hairline">
              {['Name', 'Stage', 'Check', 'Entry val', 'Current val', 'Multiple', 'Status'].map((h) => (
                <th
                  key={h}
                  className={`py-3 pr-6 font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary ${
                    ['Check', 'Entry val', 'Current val', 'Multiple'].includes(h) ? 'text-right' : 'text-left'
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr
                key={company.id}
                className="border-b border-border-hairline hover:bg-surface-warm/50 transition-colors duration-200"
              >
                <td className="py-4 pr-6">
                  <Link
                    href={`/admin/portfolio/${company.slug}`}
                    className="font-inter text-body text-ink-primary hover:text-accent-positive transition-colors duration-200"
                  >
                    {company.name}
                  </Link>
                </td>
                <td className="py-4 pr-6">
                  {company.stage ? (
                    <StagePill stage={company.stage} />
                  ) : (
                    <span className="text-ink-tertiary font-inter text-body">—</span>
                  )}
                </td>
                <td className="py-4 pr-6 text-right font-mono text-mono-sm text-ink-primary">
                  {company.check_size != null ? formatUSD(company.check_size) : '—'}
                </td>
                <td className="py-4 pr-6 text-right font-mono text-mono-sm text-ink-secondary">
                  {company.entry_valuation != null ? formatUSD(company.entry_valuation) : '—'}
                </td>
                <td className="py-4 pr-6 text-right font-mono text-mono-sm text-ink-primary">
                  {company.current_valuation != null ? formatUSD(company.current_valuation) : '—'}
                </td>
                <td className="py-4 pr-6 text-right font-mono text-mono-sm text-ink-primary">
                  {company.current_multiple != null ? formatMult(company.current_multiple) : '—'}
                </td>
                <td className="py-4">
                  <StatusPill status={company.status} />
                </td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center font-inter text-body text-ink-secondary">
                  No companies yet. Add the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="block md:hidden">
        <ul className="flex flex-col gap-3">
          {companies.map((company) => (
            <li key={company.id}>
              <Link
                href={`/admin/portfolio/${company.slug}`}
                className="block rounded-card border border-border-hairline bg-surface p-4 hover:shadow-card-hover transition-shadow duration-200"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-inter text-body text-ink-primary">{company.name}</p>
                  <StatusPill status={company.status} />
                </div>
                <div className="flex items-center gap-3">
                  {company.stage && <StagePill stage={company.stage} />}
                  {company.check_size != null && (
                    <span className="font-mono text-mono-sm text-ink-secondary">
                      {formatUSD(company.check_size)}
                    </span>
                  )}
                  {company.current_multiple != null && (
                    <span className="font-mono text-mono-sm text-ink-primary">
                      {formatMult(company.current_multiple)}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
          {companies.length === 0 && (
            <li className="py-12 text-center font-inter text-body text-ink-secondary">
              No companies yet.
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: PortfolioCompany['status'] }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center rounded-pill bg-pill-mint-bg px-2.5 py-1 font-inter text-caption text-pill-mint-ink">
        Active
      </span>
    )
  }
  if (status === 'exited') {
    return (
      <span className="inline-flex items-center rounded-pill bg-pill-peach-bg px-2.5 py-1 font-inter text-caption text-pill-peach-ink">
        Exited
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-pill bg-pill-slate-bg px-2.5 py-1 font-inter text-caption text-pill-slate-ink">
      Written off
    </span>
  )
}
