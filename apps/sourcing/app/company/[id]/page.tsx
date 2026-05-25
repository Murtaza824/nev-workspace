import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@nev/db'
import {
  signalTypeColors,
  signalTypeLabels,
  formatRelativeTime,
} from '@/app/lib/signal-helpers'

type Params = Promise<{ id: string }>

type Company = {
  id: string
  name: string
  domain: string | null
  linkedin_url: string | null
  status: string | null
  founded_at: string | null
  github_org: string | null
  headcount: number | null
}

type CompanySignal = {
  id: string
  signal_type: string
  detected_at: string
  summary: string | null
  score: number | null
  sourcing_people: { id: string; full_name: string | null } | null
}

const STATUS_LABELS: Record<string, string> = {
  stealth: 'STEALTH',
  public: 'PUBLIC',
  announced: 'ANNOUNCED',
  shut_down: 'SHUT DOWN',
}

export default async function CompanyPage({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createServerClient()

  const [{ data: rawCompany }, { data: rawSignals }] = await Promise.all([
    supabase
      .from('sourcing_companies')
      .select('id, name, domain, linkedin_url, status, founded_at, github_org, headcount')
      .eq('id', id)
      .single(),
    supabase
      .from('sourcing_signals')
      .select('id, signal_type, detected_at, summary, score, sourcing_people(id, full_name)')
      .eq('company_id', id)
      .order('detected_at', { ascending: false })
      .limit(20),
  ])

  const company = rawCompany as unknown as Company | null
  if (!company) notFound()

  const signals = (rawSignals ?? []) as unknown as CompanySignal[]

  return (
    <main
      className="min-h-screen px-6 py-4"
      style={{ backgroundColor: 'var(--color-background-primary)' }}
    >
      {/* Back nav */}
      <div className="mb-[14px]">
        <Link
          href="/"
          className="inline-flex items-center gap-[6px] text-[12px]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: '14px' }} aria-hidden="true" />
          Feed
        </Link>
      </div>

      {/* Company header */}
      <div
        className="flex items-start gap-[14px] pb-[16px]"
        style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}
      >
        <div
          className="w-[48px] h-[48px] rounded-[10px] flex items-center justify-center text-[18px] font-medium flex-shrink-0"
          style={{
            background: 'var(--color-background-secondary)',
            color: 'var(--color-text-primary)',
          }}
        >
          {company.name.slice(0, 1).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[8px] flex-wrap mb-[4px]">
            <span
              className="text-[18px] font-medium"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {company.name}
            </span>
            {company.status && (
              <span
                className="font-mono text-[10px] tracking-[0.06em] px-[7px] py-[1px] rounded-[4px]"
                style={{
                  background: 'var(--color-background-secondary)',
                  color: 'var(--color-text-tertiary)',
                }}
              >
                {STATUS_LABELS[company.status] ?? company.status.toUpperCase()}
              </span>
            )}
          </div>

          <div
            className="flex items-center gap-[12px] font-mono text-[11px] flex-wrap"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {company.domain && <span>{company.domain}</span>}
            {company.founded_at && (
              <span>Founded {new Date(company.founded_at).getFullYear()}</span>
            )}
            {company.headcount != null && <span>{company.headcount} headcount</span>}
            {company.linkedin_url && (
              <a
                href={company.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-[3px]"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                <i
                  className="ti ti-brand-linkedin"
                  style={{ fontSize: '13px' }}
                  aria-hidden="true"
                />
                LinkedIn
              </a>
            )}
            {company.github_org && (
              <a
                href={`https://github.com/${company.github_org}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-[3px]"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                <i
                  className="ti ti-brand-github"
                  style={{ fontSize: '13px' }}
                  aria-hidden="true"
                />
                {company.github_org}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Signals */}
      <div className="pt-[14px]">
        <div
          className="font-mono text-[10px] tracking-[0.06em] mb-[12px]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          LINKED SIGNALS · {signals.length}
        </div>

        {signals.length === 0 ? (
          <p className="text-[13px]" style={{ color: 'var(--color-text-tertiary)' }}>
            No signals linked to this company yet.
          </p>
        ) : (
          signals.map((signal, i) => {
            const colors = signalTypeColors[signal.signal_type] ?? signalTypeColors.job_change
            const isLast = i === signals.length - 1

            return (
              <Link
                key={signal.id}
                href={`/signal/${signal.id}`}
                className="flex items-start gap-[12px] py-[12px]"
                style={
                  !isLast ? { borderBottom: '0.5px solid var(--color-border-tertiary)' } : undefined
                }
              >
                <span
                  className="font-mono text-[10px] tracking-[0.06em] px-[7px] py-[1px] rounded-[4px] flex-shrink-0 mt-[2px]"
                  style={{ background: colors.bg, color: colors.fg }}
                >
                  {signalTypeLabels[signal.signal_type] ?? signal.signal_type.toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  {signal.sourcing_people?.full_name && (
                    <div
                      className="text-[13px] font-medium mb-[1px]"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {signal.sourcing_people.full_name}
                    </div>
                  )}
                  {signal.summary && (
                    <div
                      className="text-[12px] leading-[1.5] mb-[3px] truncate"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {signal.summary}
                    </div>
                  )}
                  <div
                    className="font-mono text-[11px]"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    {formatRelativeTime(signal.detected_at)}
                  </div>
                </div>
                {signal.score !== null && (
                  <span
                    className="font-mono text-[13px] font-medium flex-shrink-0"
                    style={{
                      color:
                        signal.score >= 85
                          ? 'var(--color-accent-teal)'
                          : 'var(--color-text-primary)',
                    }}
                  >
                    {signal.score}
                  </span>
                )}
              </Link>
            )
          })
        )}
      </div>
    </main>
  )
}
