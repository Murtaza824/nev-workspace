import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@nev/db'
import {
  signalTypeColors,
  signalTypeLabels,
  getInitials,
  formatRelativeTime,
  getSourceIcon,
  getSourceLabel,
} from '../../lib/signal-helpers'
import { ActionButtons } from './ActionButtons'
import { NoteForm } from './NoteForm'

type Params = Promise<{ id: string }>

type SignalDetail = {
  id: string
  signal_type: string
  source: string
  person_id: string | null
  company_id: string | null
  event_at: string | null
  detected_at: string
  summary: string | null
  evidence: Record<string, unknown> | null
  score: number | null
  score_breakdown: Record<string, number> | null
  status: 'new' | 'reviewed' | 'pursuing' | 'passed' | 'snoozed'
  sourcing_people: {
    id: string
    full_name: string | null
    current_title: string | null
    current_company: string | null
  } | null
}

type RelatedSignal = {
  id: string
  signal_type: string
  detected_at: string
  summary: string | null
  score: number | null
}

type SignalNote = {
  id: string
  body: string
  created_at: string
  profiles: { full_name: string | null } | null
}

const BREAKDOWN_LABELS: Record<string, string> = {
  recency: 'RECENCY',
  density: 'DENSITY',
  cluster: 'CLUSTER',
  seniority: 'SENIORITY',
  tier: 'TIER',
}
const BREAKDOWN_ORDER = ['recency', 'density', 'cluster', 'seniority', 'tier'] as const

export default async function SignalDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: rawSignal } = await supabase
    .from('sourcing_signals')
    .select(
      'id, signal_type, source, person_id, company_id, event_at, detected_at, summary, evidence, score, score_breakdown, status, sourcing_people(id, full_name, current_title, current_company)'
    )
    .eq('id', id)
    .single()

  const signal = rawSignal as unknown as SignalDetail | null
  if (!signal) notFound()

  const person = signal.sourcing_people
  const name = person?.full_name ?? 'Unknown'
  const context = person?.current_title ?? person?.current_company ?? null
  const colors = signalTypeColors[signal.signal_type] ?? signalTypeColors.job_change
  const initials = getInitials(name)
  const score = signal.score
  const scoreColor = score !== null && score >= 85 ? 'var(--color-accent-teal)' : 'var(--color-text-primary)'
  const breakdown = signal.score_breakdown
  const evidence = signal.evidence
  const refTime = signal.event_at ?? signal.detected_at

  // Auto-mark as reviewed when opened
  if (signal.status === 'new') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('sourcing_signals') as any).update({ status: 'reviewed' }).eq('id', id)
  }

  const relatedFilterBase = signal.person_id
    ? supabase.from('sourcing_signals').select('id, signal_type, detected_at, summary, score').eq('person_id', signal.person_id).neq('id', id).order('detected_at', { ascending: false }).limit(5)
    : signal.company_id
    ? supabase.from('sourcing_signals').select('id, signal_type, detected_at, summary, score').eq('company_id', signal.company_id).neq('id', id).order('detected_at', { ascending: false }).limit(5)
    : null

  const [relatedResult, { data: rawNotes }] = await Promise.all([
    relatedFilterBase ?? Promise.resolve({ data: [] }),
    supabase
      .from('sourcing_signal_notes')
      .select('id, body, created_at, profiles(full_name)')
      .eq('signal_id', id)
      .order('created_at', { ascending: true }),
  ])

  const relatedSignals = (relatedResult.data ?? []) as unknown as RelatedSignal[]
  const notes = (rawNotes ?? []) as unknown as SignalNote[]
  const currentStatus = (signal.status === 'new' ? 'reviewed' : signal.status) as 'reviewed' | 'pursuing' | 'passed' | 'snoozed'

  return (
    <main
      className="min-h-screen px-6 py-4"
      style={{ backgroundColor: 'var(--color-background-primary)' }}
    >
      {/* Back nav */}
      <div className="mb-[14px]">
        <Link
          href="/"
          className="inline-flex items-center gap-[6px] text-[12px] cursor-pointer"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: '14px' }} aria-hidden="true" />
          Feed
        </Link>
      </div>

      {/* Signal header */}
      <div
        className="flex items-start gap-[14px] pb-[16px]"
        style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}
      >
        <div
          className={`w-[44px] h-[44px] ${signal.person_id ? 'rounded-full' : 'rounded-[8px]'} flex items-center justify-center text-[14px] font-medium flex-shrink-0`}
          style={{ background: colors.bg, color: colors.fg }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[8px] flex-wrap mb-[2px]">
            <span className="text-[17px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {name}
            </span>
            <span
              className="font-mono text-[10px] tracking-[0.06em] px-[7px] py-[1px] rounded-[4px]"
              style={{ background: colors.bg, color: colors.fg }}
            >
              {signalTypeLabels[signal.signal_type] ?? signal.signal_type.toUpperCase()}
            </span>
          </div>
          {context && (
            <div className="text-[13px]" style={{ color: 'var(--color-text-tertiary)' }}>
              {context}
            </div>
          )}
          <div
            className="flex items-center gap-[8px] mt-[6px] font-mono text-[11px]"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <span>
              <i className={`ti ${getSourceIcon(signal.source)}`} style={{ fontSize: '12px', verticalAlign: '-1px' }} aria-hidden="true" />
              {' '}{getSourceLabel(signal.source)}
            </span>
            <span>·</span>
            <span>{formatRelativeTime(refTime)}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-[2px] flex-shrink-0">
          <div className="text-[24px] font-medium font-mono" style={{ color: scoreColor }}>
            {score ?? '—'}
          </div>
          <div className="font-mono text-[9px] tracking-[0.08em]" style={{ color: 'var(--color-text-tertiary)' }}>
            FIT
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      {breakdown && (
        <div
          className="py-[14px]"
          style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}
        >
          <div className="font-mono text-[10px] tracking-[0.06em] mb-[8px]" style={{ color: 'var(--color-text-tertiary)' }}>
            SCORE BREAKDOWN
          </div>
          <div className="flex flex-wrap gap-x-[20px] gap-y-[6px]">
            {BREAKDOWN_ORDER.map(key => (
              <div key={key} className="flex items-baseline gap-[5px]">
                <span className="font-mono text-[10px] tracking-[0.06em]" style={{ color: 'var(--color-text-tertiary)' }}>
                  {BREAKDOWN_LABELS[key]}
                </span>
                <span className="font-mono text-[15px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {breakdown[key] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {signal.summary && (
        <div
          className="py-[14px]"
          style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}
        >
          <div className="font-mono text-[10px] tracking-[0.06em] mb-[8px]" style={{ color: 'var(--color-text-tertiary)' }}>
            SUMMARY
          </div>
          <p className="text-[14px] leading-[1.6]" style={{ color: 'var(--color-text-secondary)' }}>
            {signal.summary}
          </p>
        </div>
      )}

      {/* Evidence */}
      {evidence && Object.keys(evidence).length > 0 && (
        <div
          className="py-[14px]"
          style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}
        >
          <div className="font-mono text-[10px] tracking-[0.06em] mb-[8px]" style={{ color: 'var(--color-text-tertiary)' }}>
            EVIDENCE
          </div>
          <div className="flex flex-col gap-[8px]">
            {Object.entries(evidence).map(([key, val]) => (
              <div key={key} className="flex gap-[12px]">
                <span
                  className="font-mono text-[11px] tracking-[0.04em] flex-shrink-0 pt-[1px]"
                  style={{ color: 'var(--color-text-tertiary)', minWidth: '110px' }}
                >
                  {key.replace(/_/g, ' ').toUpperCase()}
                </span>
                <span className="text-[13px] leading-[1.5] break-all" style={{ color: 'var(--color-text-secondary)' }}>
                  {typeof val === 'string' ? val : JSON.stringify(val)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div
        className="py-[14px]"
        style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}
      >
        <div className="font-mono text-[10px] tracking-[0.06em] mb-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
          ACTIONS
        </div>
        <ActionButtons signalId={id} currentStatus={currentStatus} />
      </div>

      {/* Related signals */}
      {relatedSignals.length > 0 && (
        <div
          className="py-[14px]"
          style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}
        >
          <div className="font-mono text-[10px] tracking-[0.06em] mb-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
            OTHER SIGNALS
          </div>
          <div className="flex flex-col">
            {relatedSignals.map((s, i) => {
              const rc = signalTypeColors[s.signal_type] ?? signalTypeColors.job_change
              const isLast = i === relatedSignals.length - 1
              return (
                <Link
                  key={s.id}
                  href={`/signal/${s.id}`}
                  className="flex items-start gap-[10px] py-[10px]"
                  style={!isLast ? { borderBottom: '0.5px solid var(--color-border-tertiary)' } : undefined}
                >
                  <span
                    className="font-mono text-[10px] tracking-[0.06em] px-[6px] py-[1px] rounded-[4px] flex-shrink-0 mt-[1px]"
                    style={{ background: rc.bg, color: rc.fg }}
                  >
                    {signalTypeLabels[s.signal_type] ?? s.signal_type.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    {s.summary && (
                      <div className="text-[12px] leading-[1.5] truncate" style={{ color: 'var(--color-text-secondary)' }}>
                        {s.summary}
                      </div>
                    )}
                    <div className="font-mono text-[11px] mt-[2px]" style={{ color: 'var(--color-text-tertiary)' }}>
                      {formatRelativeTime(s.detected_at)}
                    </div>
                  </div>
                  {s.score !== null && (
                    <span
                      className="font-mono text-[13px] font-medium flex-shrink-0"
                      style={{ color: s.score >= 85 ? 'var(--color-accent-teal)' : 'var(--color-text-primary)' }}
                    >
                      {s.score}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="py-[14px]">
        <div className="font-mono text-[10px] tracking-[0.06em] mb-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
          NOTES
        </div>
        {notes.length > 0 ? (
          <div className="flex flex-col gap-[12px] mb-[14px]">
            {notes.map(note => (
              <div key={note.id}>
                <div
                  className="flex items-center gap-[8px] mb-[3px] font-mono text-[11px]"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  <span>{note.profiles?.full_name ?? 'Unknown'}</span>
                  <span>·</span>
                  <span>{formatRelativeTime(note.created_at)}</span>
                </div>
                <p className="text-[13px] leading-[1.5]" style={{ color: 'var(--color-text-secondary)' }}>
                  {note.body}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] mb-[14px]" style={{ color: 'var(--color-text-tertiary)' }}>
            No notes yet.
          </p>
        )}
        <NoteForm signalId={id} />
      </div>
    </main>
  )
}
