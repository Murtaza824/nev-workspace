import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@nev/db'
import {
  signalTypeColors,
  signalTypeLabels,
  getInitials,
  formatRelativeTime,
} from '@/app/lib/signal-helpers'

type Params = Promise<{ id: string }>

type Person = {
  id: string
  full_name: string
  current_title: string | null
  current_company: string | null
  linkedin_url: string | null
  github_username: string | null
  twitter_handle: string | null
  tier_1_alum: boolean
  seniority_tier: string | null
  location: string | null
  last_enriched_at: string | null
}

type PersonSignal = {
  id: string
  signal_type: string
  source: string
  event_at: string | null
  detected_at: string
  summary: string | null
  score: number | null
  status: string
}

export default async function PersonPage({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createServerClient()

  const [{ data: rawPerson }, { data: rawSignals }] = await Promise.all([
    supabase
      .from('sourcing_people')
      .select(
        'id, full_name, current_title, current_company, linkedin_url, github_username, twitter_handle, tier_1_alum, seniority_tier, location, last_enriched_at'
      )
      .eq('id', id)
      .single(),
    supabase
      .from('sourcing_signals')
      .select('id, signal_type, source, event_at, detected_at, summary, score, status')
      .eq('person_id', id)
      .order('detected_at', { ascending: false })
      .limit(50),
  ])

  const person = rawPerson as unknown as Person | null
  if (!person) notFound()

  const signals = (rawSignals ?? []) as unknown as PersonSignal[]
  const initials = getInitials(person.full_name)

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

      {/* Person header */}
      <div
        className="flex items-start gap-[14px] pb-[16px]"
        style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}
      >
        <div
          className="w-[48px] h-[48px] rounded-full flex items-center justify-center text-[16px] font-medium flex-shrink-0"
          style={{
            background: 'var(--color-background-secondary)',
            color: 'var(--color-text-primary)',
          }}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[8px] flex-wrap mb-[3px]">
            <span
              className="text-[18px] font-medium"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {person.full_name}
            </span>
            {person.tier_1_alum && (
              <span
                className="font-mono text-[10px] tracking-[0.06em] px-[7px] py-[1px] rounded-[4px]"
                style={{ background: '#E1F5EE', color: '#085041' }}
              >
                TIER 1
              </span>
            )}
            {person.seniority_tier && (
              <span
                className="font-mono text-[10px] tracking-[0.06em] px-[7px] py-[1px] rounded-[4px]"
                style={{
                  background: 'var(--color-background-secondary)',
                  color: 'var(--color-text-tertiary)',
                }}
              >
                {person.seniority_tier.toUpperCase()}
              </span>
            )}
          </div>

          {(person.current_title || person.current_company) && (
            <div
              className="text-[13px] mb-[6px]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {person.current_title ?? person.current_company}
              {person.current_title && person.current_company && (
                <span style={{ color: 'var(--color-text-tertiary)' }}>
                  {' '}· {person.current_company}
                </span>
              )}
            </div>
          )}

          {person.location && (
            <div
              className="text-[12px] mb-[5px]"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              <i
                className="ti ti-map-pin"
                style={{ fontSize: '12px', verticalAlign: '-1px', marginRight: '3px' }}
                aria-hidden="true"
              />
              {person.location}
            </div>
          )}

          <div
            className="flex items-center gap-[12px] font-mono text-[11px] flex-wrap"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {person.linkedin_url && (
              <a
                href={person.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-[3px]"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                <i className="ti ti-brand-linkedin" style={{ fontSize: '13px' }} aria-hidden="true" />
                LinkedIn
              </a>
            )}
            {person.github_username && (
              <a
                href={`https://github.com/${person.github_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-[3px]"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                <i className="ti ti-brand-github" style={{ fontSize: '13px' }} aria-hidden="true" />
                {person.github_username}
              </a>
            )}
            {person.twitter_handle && (
              <a
                href={`https://x.com/${person.twitter_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-[3px]"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                <i className="ti ti-brand-x" style={{ fontSize: '13px' }} aria-hidden="true" />
                {person.twitter_handle}
              </a>
            )}
            {person.last_enriched_at && (
              <span>Updated {formatRelativeTime(person.last_enriched_at)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Signal history */}
      <div className="pt-[14px]">
        <div
          className="font-mono text-[10px] tracking-[0.06em] mb-[12px]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          SIGNAL HISTORY · {signals.length}
        </div>

        {signals.length === 0 ? (
          <p className="text-[13px]" style={{ color: 'var(--color-text-tertiary)' }}>
            No signals yet.
          </p>
        ) : (
          signals.map((signal, i) => {
            const colors = signalTypeColors[signal.signal_type] ?? signalTypeColors.job_change
            const refTime = signal.event_at ?? signal.detected_at
            const score = signal.score
            const scoreColor =
              score !== null && score >= 85
                ? 'var(--color-accent-teal)'
                : 'var(--color-text-primary)'
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
                  {signal.summary && (
                    <div
                      className="text-[13px] leading-[1.5] mb-[3px]"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {signal.summary}
                    </div>
                  )}
                  <div
                    className="font-mono text-[11px]"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    {formatRelativeTime(refTime)}
                  </div>
                </div>
                {score !== null && (
                  <span
                    className="font-mono text-[13px] font-medium flex-shrink-0"
                    style={{ color: scoreColor }}
                  >
                    {score}
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
