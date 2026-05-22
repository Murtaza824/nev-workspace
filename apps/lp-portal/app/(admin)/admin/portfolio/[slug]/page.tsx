import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { formatUSD, formatMult, formatDate } from '@/lib/format'
import { PortfolioCompanyForm } from '@/components/admin/PortfolioCompanyForm'
import { ValuationEventForm } from '@/components/admin/ValuationEventForm'
import { CoInvestorManager } from '@/components/admin/CoInvestorManager'
import type { PortfolioCompany, ValuationEvent, CoInvestor } from '@/lib/types'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function AdminPortfolioEditPage({ params }: PageProps) {
  const { slug } = await params
  const adminSupabase = createAdminClient()

  const [companyResult, valuationEventsResult, coInvestorsResult] = await Promise.all([
    adminSupabase
      .from('portfolio_companies')
      .select('*')
      .eq('slug', slug)
      .single(),
    adminSupabase
      .from('valuation_events')
      .select('*')
      .order('event_date', { ascending: false }),
    adminSupabase
      .from('co_investors')
      .select('*')
      .order('order', { ascending: true }),
  ])

  if (!companyResult.data) notFound()

  const company = companyResult.data as PortfolioCompany
  const allValuationEvents = (valuationEventsResult.data ?? []) as ValuationEvent[]
  const allCoInvestors = (coInvestorsResult.data ?? []) as CoInvestor[]

  const valuationEvents = allValuationEvents.filter((e) => e.company_id === company.id)
  const coInvestors = allCoInvestors.filter((ci) => ci.company_id === company.id)

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8 animate-fade-up">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link href="/admin/portfolio" className="font-inter text-body text-ink-secondary hover:text-ink-primary transition-colors duration-200">
          ← Portfolio
        </Link>
      </nav>

      <h1 className="font-fraunces text-display-2-mobile md:text-display-2 text-ink-primary mb-2">
        {company.name}
      </h1>
      <p className="font-inter text-body text-ink-secondary mb-8">
        Edit company details
      </p>

      {/* Edit form */}
      <PortfolioCompanyForm company={company} mode="edit" />

      {/* ── Co-investors ──────────────────────────────────────── */}
      <section aria-labelledby="co-investors-heading" className="mt-12">
        <h2 id="co-investors-heading" className="font-fraunces text-heading text-ink-primary mb-4">
          Co-investors
        </h2>
        <CoInvestorManager
          companyId={company.id}
          slug={company.slug}
          initialCoInvestors={coInvestors}
        />
      </section>

      {/* ── Valuation events ──────────────────────────────────── */}
      <section aria-labelledby="valuation-events-heading" className="mt-12">
        <h2 id="valuation-events-heading" className="font-fraunces text-heading text-ink-primary mb-6">
          Log valuation event
        </h2>

        <ValuationEventForm companyId={company.id} slug={company.slug} />

        {/* Existing events */}
        {valuationEvents.length > 0 && (
          <div className="mt-8">
            <h3 className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary mb-4">
              History
            </h3>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border-hairline">
                    {['Date', 'Type', 'Company val', 'Position val', 'Multiple', 'Note'].map((h) => (
                      <th
                        key={h}
                        className={`py-3 pr-6 font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary ${
                          ['Company val', 'Position val', 'Multiple'].includes(h) ? 'text-right' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {valuationEvents.map((event) => (
                    <tr key={event.id} className="border-b border-border-hairline">
                      <td className="py-3 pr-6 font-mono text-mono-sm text-ink-secondary">
                        {formatDate(event.event_date)}
                      </td>
                      <td className="py-3 pr-6 font-inter text-body text-ink-primary capitalize">
                        {event.event_type ?? '—'}
                      </td>
                      <td className="py-3 pr-6 text-right font-mono text-mono-sm text-ink-primary">
                        {event.new_company_valuation != null ? formatUSD(event.new_company_valuation) : '—'}
                      </td>
                      <td className="py-3 pr-6 text-right font-mono text-mono-sm text-ink-primary">
                        {event.new_position_value != null ? formatUSD(event.new_position_value) : '—'}
                      </td>
                      <td className="py-3 pr-6 text-right font-mono text-mono-sm text-ink-primary">
                        {event.multiple != null ? formatMult(event.multiple) : '—'}
                      </td>
                      <td className="py-3 font-inter text-body text-ink-secondary max-w-xs truncate">
                        {event.note ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile valuation events */}
            <ul className="block md:hidden flex-col gap-3 mt-4">
              {valuationEvents.map((event) => (
                <li key={event.id} className="rounded-card border border-border-hairline bg-surface p-4 mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-mono-sm text-ink-secondary">{formatDate(event.event_date)}</span>
                    <span className="font-inter text-body text-ink-primary capitalize">{event.event_type ?? '—'}</span>
                  </div>
                  {event.new_company_valuation != null && (
                    <p className="font-mono text-mono-sm text-ink-primary">
                      Company: {formatUSD(event.new_company_valuation)}
                    </p>
                  )}
                  {event.multiple != null && (
                    <p className="font-mono text-mono-sm text-ink-primary">
                      Multiple: {formatMult(event.multiple)}
                    </p>
                  )}
                  {event.note && (
                    <p className="font-inter text-body text-ink-secondary mt-1">{event.note}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}
