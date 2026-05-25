import Link from 'next/link'
import { createServerClient } from '@nev/db'
import { LinkedInButton } from '@/app/LinkedInButton'
import { PersonButton } from '@/app/PersonButton'
import {
  signalTypeColors,
  signalTypeLabels,
  getInitials,
  formatRelativeTime,
  getSourceIcon,
  getSourceLabel,
} from '@/app/lib/signal-helpers'

type FeedSignal = {
  id: string
  signal_type: string
  source: string
  person_id: string | null
  event_at: string | null
  detected_at: string
  summary: string | null
  score: number | null
  sourcing_people: {
    id: string
    full_name: string | null
    current_title: string | null
    current_company: string | null
    linkedin_url: string | null
  } | null
}

export default async function PursuingPage() {
  const supabase = await createServerClient()

  const { data: rawSignals } = await supabase
    .from('sourcing_signals')
    .select(
      'id, signal_type, source, person_id, event_at, detected_at, summary, score, sourcing_people(id, full_name, current_title, current_company, linkedin_url)'
    )
    .eq('status', 'pursuing')
    .order('score', { ascending: false, nullsFirst: false })
    .limit(100)

  const signals = (rawSignals ?? []) as unknown as FeedSignal[]

  return (
    <main
      className="min-h-screen px-6 py-4"
      style={{ backgroundColor: 'var(--color-background-primary)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between pb-[14px]"
        style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}
      >
        <div className="flex items-center gap-[10px]">
          <Link
            href="/"
            className="inline-flex items-center gap-[6px] text-[12px]"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <i className="ti ti-arrow-left" style={{ fontSize: '14px' }} aria-hidden="true" />
          </Link>
          <div>
            <div className="text-[15px] font-medium leading-[1.2]">Pursuing</div>
            <div
              className="font-mono text-[10px] mt-[2px] tracking-[0.08em]"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {signals.length} {signals.length === 1 ? 'SIGNAL' : 'SIGNALS'}
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="mt-[14px]">
        {signals.length === 0 ? (
          <div className="py-[48px] text-center">
            <p className="text-[13px]" style={{ color: 'var(--color-text-tertiary)' }}>
              No signals marked as pursuing yet.
            </p>
          </div>
        ) : (
          signals.map((signal, i) => {
            const colors = signalTypeColors[signal.signal_type] ?? signalTypeColors.job_change
            const person = signal.sourcing_people
            const name = person?.full_name ?? 'Unknown'
            const context = person?.current_title ?? person?.current_company ?? null
            const initials = getInitials(name)
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
                className="flex items-start gap-[12px] py-[14px] block"
                style={
                  !isLast ? { borderBottom: '0.5px solid var(--color-border-tertiary)' } : undefined
                }
              >
                <div
                  className={`w-[36px] h-[36px] ${signal.person_id ? 'rounded-full' : 'rounded-[7px]'} flex items-center justify-center text-[12px] font-medium flex-shrink-0`}
                  style={{ background: colors.bg, color: colors.fg }}
                >
                  {initials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-[6px] mb-[3px] flex-wrap">
                    <span
                      className="text-[14px] font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {name}
                    </span>
                    {context && (
                      <span className="text-[12px]" style={{ color: 'var(--color-text-tertiary)' }}>
                        · {context}
                      </span>
                    )}
                    <span
                      className="font-mono text-[10px] tracking-[0.06em] px-[7px] py-[1px] rounded-[4px]"
                      style={{ background: colors.bg, color: colors.fg }}
                    >
                      {signalTypeLabels[signal.signal_type] ?? signal.signal_type.toUpperCase()}
                    </span>
                  </div>

                  {signal.summary && (
                    <div
                      className="text-[13px] leading-[1.5]"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {signal.summary}
                    </div>
                  )}

                  <div
                    className="flex items-center gap-[8px] mt-[7px] font-mono text-[11px]"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    <span>
                      <i
                        className={`ti ${getSourceIcon(signal.source)}`}
                        style={{ fontSize: '12px', verticalAlign: '-1px' }}
                        aria-hidden="true"
                      />
                      {' '}
                      {getSourceLabel(signal.source)}
                    </span>
                    <span>·</span>
                    <span>{formatRelativeTime(refTime)}</span>
                    {person?.id && (
                      <>
                        <span>·</span>
                        <PersonButton id={person.id} />
                      </>
                    )}
                    {person?.linkedin_url && (
                      <>
                        <span>·</span>
                        <LinkedInButton url={person.linkedin_url} />
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-[2px] flex-shrink-0">
                  <div
                    className="text-[17px] font-medium font-mono"
                    style={{ color: scoreColor }}
                  >
                    {score ?? '—'}
                  </div>
                  <div
                    className="font-mono text-[9px] tracking-[0.08em]"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    FIT
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </main>
  )
}
