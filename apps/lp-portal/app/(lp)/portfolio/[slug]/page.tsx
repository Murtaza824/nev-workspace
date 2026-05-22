import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { formatUSD, formatMult, formatDate } from '@/lib/format'
import { StagePill } from '@/components/ui/StagePill'
import type { PortfolioCompany, ValuationEvent, CoInvestor } from '@/lib/types'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('portfolio_companies')
    .select('name')
    .eq('slug', slug)
    .single()

  const name = (data as { name?: string } | null)?.name ?? 'Company'

  return {
    title: name,
    robots: { index: false, follow: false },
  }
}

type EventType = ValuationEvent['event_type']

const eventTypePill: Record<NonNullable<EventType>, string> = {
  markup: 'bg-pill-mint-bg text-pill-mint-ink',
  markdown: 'bg-pill-peach-bg text-pill-peach-ink',
  writedown: 'bg-pill-peach-bg text-pill-peach-ink',
  initial: 'bg-pill-slate-bg text-pill-slate-ink',
  exit: 'bg-pill-mint-bg text-pill-mint-ink',
}

export default async function PortfolioCompanyPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: companyData, error: companyError } = await supabase
    .from('portfolio_companies')
    .select('*')
    .eq('slug', slug)
    .single()

  if (companyError || !companyData) {
    notFound()
  }

  const company = companyData as PortfolioCompany

  const [eventsResult, coInvestorsResult] = await Promise.all([
    supabase
      .from('valuation_events')
      .select('*')
      .eq('company_id', company.id)
      .order('event_date', { ascending: true }),
    supabase
      .from('co_investors')
      .select('*')
      .eq('company_id', company.id)
      .order('order', { ascending: true }),
  ])

  const valuationEvents = (eventsResult.data ?? []) as ValuationEvent[]
  const coInvestors = (coInvestorsResult.data ?? []) as CoInvestor[]

  const multiple = company.current_multiple ?? 1
  const currentValue = (company.check_size ?? 0) * multiple

  return (
    <div className="mx-auto max-w-[720px] px-5 py-8 md:px-8 animate-fade-up">
      {/* Back link */}
      <Link
        href="/portfolio"
        className="inline-flex items-center gap-1 font-inter text-body text-accent-positive mb-8 hover:opacity-80 transition-opacity"
      >
        ← Portfolio
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        {/* Logo or placeholder */}
        {company.logo_url ? (
          <Image
            src={company.logo_url}
            alt={`${company.name} logo`}
            width={64}
            height={64}
            className="w-14 h-14 md:w-16 md:h-16 rounded-[8px] object-contain bg-surface-warm shrink-0"
          />
        ) : (
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-[8px] bg-surface-warm border border-border-hairline flex items-center justify-center shrink-0">
            <span className="font-fraunces text-[22px] text-ink-secondary">
              {company.name.charAt(0)}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="font-fraunces text-display-2-mobile md:text-display-2 text-ink-primary leading-tight">
            {company.name}
          </h1>
          {company.one_liner && (
            <p className="font-inter text-body-lg-mobile md:text-body-lg text-ink-secondary mt-1">
              {company.one_liner}
            </p>
          )}
        </div>
      </div>

      {/* Tags row */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <StagePill stage={company.stage} />
        {company.sector && (
          <span className="inline-block rounded-pill bg-surface-warm px-2 py-0.5 font-inter text-caption text-ink-secondary">
            {company.sector}
          </span>
        )}
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-inter text-caption text-accent-positive hover:opacity-80 transition-opacity"
          >
            Website
            <svg
              width="10"
              height="10"
              viewBox="0 0 12 12"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M3.5 3a.5.5 0 000 1H7.29L2.15 9.15a.5.5 0 00.7.7L8 4.71V8.5a.5.5 0 001 0v-5a.5.5 0 00-.5-.5h-5z" />
            </svg>
          </a>
        )}
      </div>

      <hr className="border-border-hairline mb-6" />

      {/* Stat strip: 2-up mobile, 4-up desktop */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-5 mb-8 md:grid-cols-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
            Check size
          </span>
          <span className="font-mono text-mono-md text-ink-primary">
            {company.check_size ? formatUSD(company.check_size) : '—'}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
            Entry valuation
          </span>
          <span className="font-mono text-mono-md text-ink-primary">
            {company.entry_valuation ? formatUSD(company.entry_valuation) : '—'}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
            Ownership
          </span>
          <span className="font-mono text-mono-md text-ink-primary">
            {company.ownership_pct != null
              ? `${company.ownership_pct.toFixed(2)}%`
              : '—'}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
            Current multiple
          </span>
          <span
            className={`font-mono text-mono-md ${multiple > 1.0 ? 'text-accent-positive' : 'text-ink-primary'}`}
          >
            {formatMult(multiple)}
          </span>
        </div>
      </div>

      <hr className="border-border-hairline mb-8" />

      {/* Investment Memo */}
      <section className="mb-8">
        <h2 className="font-fraunces text-heading-mobile md:text-heading text-ink-primary mb-3">
          Investment memo
        </h2>
        {company.memo_pdf_url ? (
          <a
            href={company.memo_pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-input border border-border-hairline bg-surface px-4 py-2.5 font-inter text-body text-ink-primary hover:bg-surface-warm transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M4 1a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5.5L9.5 1H4zm5 0v4h4M6 9h4M6 11h4M6 7h2" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
            </svg>
            View investment memo
          </a>
        ) : (
          <p className="font-inter text-body-lg-mobile md:text-body-lg text-ink-secondary">
            Investment memo available upon request.
          </p>
        )}
      </section>

      {/* Valuation history */}
      {valuationEvents.length > 0 && (
        <section className="mb-8">
          <h2 className="font-fraunces text-heading-mobile md:text-heading text-ink-primary mb-4">
            Valuation history
          </h2>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border-hairline">
                  <th className="py-2 pr-4 text-left font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
                    Date
                  </th>
                  <th className="py-2 pr-4 text-left font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
                    Type
                  </th>
                  <th className="py-2 pr-4 text-right font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
                    Company val
                  </th>
                  <th className="py-2 pr-4 text-right font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
                    NEV value
                  </th>
                  <th className="py-2 pr-4 text-right font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
                    Multiple
                  </th>
                  <th className="py-2 text-left font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody>
                {valuationEvents.map((ev) => (
                  <tr key={ev.id} className="border-b border-border-hairline">
                    <td className="py-2 pr-4 font-mono text-mono-sm text-ink-primary whitespace-nowrap">
                      {formatDate(ev.event_date)}
                    </td>
                    <td className="py-2 pr-4">
                      {ev.event_type && (
                        <span
                          className={`inline-block rounded-pill px-2 py-0.5 font-inter text-caption capitalize ${eventTypePill[ev.event_type] ?? 'bg-pill-slate-bg text-pill-slate-ink'}`}
                        >
                          {ev.event_type}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 font-mono text-mono-md text-ink-primary text-right whitespace-nowrap">
                      {ev.new_company_valuation
                        ? formatUSD(ev.new_company_valuation)
                        : '—'}
                    </td>
                    <td className="py-2 pr-4 font-mono text-mono-md text-ink-primary text-right whitespace-nowrap">
                      {ev.new_position_value
                        ? formatUSD(ev.new_position_value)
                        : '—'}
                    </td>
                    <td className="py-2 pr-4 font-mono text-mono-md text-ink-primary text-right whitespace-nowrap">
                      {ev.multiple != null ? formatMult(ev.multiple) : '—'}
                    </td>
                    <td className="py-2 font-inter text-caption text-ink-secondary max-w-[180px]">
                      {ev.note ?? ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked rows */}
          <div className="md:hidden flex flex-col gap-3">
            {valuationEvents.map((ev) => (
              <div
                key={ev.id}
                className="border-b border-border-hairline pb-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-mono-sm text-ink-secondary">
                    {formatDate(ev.event_date)}
                  </span>
                  {ev.multiple != null && (
                    <span className="font-mono text-mono-sm text-ink-primary">
                      {formatMult(ev.multiple)}
                    </span>
                  )}
                </div>
                {ev.note && (
                  <p className="font-inter text-caption text-ink-secondary">
                    {ev.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Co-investors */}
      {coInvestors.length > 0 && (
        <section className="mb-8">
          <h2 className="font-fraunces text-heading-mobile md:text-heading text-ink-primary mb-3">
            Co-investors
          </h2>
          <div className="flex flex-wrap gap-2">
            {coInvestors.map((ci) => (
              <span
                key={ci.id}
                className="inline-block rounded-pill bg-surface-warm px-3 py-1 font-inter text-body text-ink-primary"
              >
                {ci.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Current value callout */}
      <div className="rounded-card border border-border-hairline p-5 bg-surface">
        <p className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary mb-1">
          NEV current value
        </p>
        <p className="font-mono text-mono-lg text-ink-primary">
          {formatUSD(currentValue)}
        </p>
        <p className="font-inter text-caption text-ink-secondary mt-1">
          {formatUSD(company.check_size ?? 0)} cost · {formatMult(multiple)} multiple
        </p>
      </div>
    </div>
  )
}
