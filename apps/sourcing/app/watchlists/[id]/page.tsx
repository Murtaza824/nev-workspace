import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@nev/db'
import { LinkedInButton } from '@/app/LinkedInButton'
import { PersonButton } from '@/app/PersonButton'
import { deleteWatchlist } from '@/app/actions/watchlists'
import {
  signalTypeColors,
  signalTypeLabels,
  filterLabels,
  getInitials,
  formatRelativeTime,
  getSourceIcon,
  getSourceLabel,
} from '@/app/lib/signal-helpers'
import type { WatchlistFilters } from '@/app/lib/types'

type Params = Promise<{ id: string }>
type SearchParams = Promise<{ page?: string }>

type Watchlist = {
  id: string
  name: string
  filters: WatchlistFilters
}

type FeedSignal = {
  id: string
  signal_type: string
  source: string
  person_id: string | null
  event_at: string | null
  detected_at: string
  summary: string | null
  score: number | null
  status: string
  sourcing_people: {
    id: string
    full_name: string | null
    current_title: string | null
    current_company: string | null
    linkedin_url: string | null
  } | null
}

const ACTIVE_STATUSES = ['new', 'reviewed', 'pursuing'] as const

const PAGE_SIZE = 50

export default async function WatchlistDetailPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: SearchParams
}) {
  const { id } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE
  const supabase = await createServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawWatchlist } = await (supabase.from('sourcing_watchlists') as any)
    .select('id, name, filters')
    .eq('id', id)
    .single()

  const watchlist = rawWatchlist as Watchlist | null
  if (!watchlist) notFound()

  const filters: WatchlistFilters = watchlist.filters ?? {}

  let query = supabase
    .from('sourcing_signals')
    .select(
      'id, signal_type, source, person_id, event_at, detected_at, summary, score, status, sourcing_people(id, full_name, current_title, current_company, linkedin_url)'
    )
    .in('status', [...ACTIVE_STATUSES])
    .order('score', { ascending: false, nullsFirst: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (filters.signal_types && filters.signal_types.length > 0) {
    query = query.in('signal_type', filters.signal_types)
  }

  if (filters.min_score != null) {
    query = query.gte('score', filters.min_score)
  }

  const { data: rawSignals } = await query
  const signals = (rawSignals ?? []) as unknown as FeedSignal[]

  const deleteAction = deleteWatchlist.bind(null, id)
  const hasPrev = page > 1
  const hasNext = signals.length === PAGE_SIZE

  function pageHref(p: number) {
    return p > 1 ? `/watchlists/${id}?page=${p}` : `/watchlists/${id}`
  }

  return (
    <main
      className="min-h-screen px-6 py-4"
      style={{ backgroundColor: 'var(--color-background-primary)' }}
    >
      {/* Back nav */}
      <div className="mb-[14px]">
        <Link
          href="/watchlists"
          className="inline-flex items-center gap-[6px] text-[12px]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: '14px' }} aria-hidden="true" />
          Watchlists
        </Link>
      </div>

      {/* Header */}
      <div
        className="flex items-start justify-between pb-[14px] mb-[14px]"
        style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}
      >
        <div>
          <div className="text-[17px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {watchlist.name}
          </div>
          <div
            className="font-mono text-[11px] mt-[3px]"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {filters.signal_types && filters.signal_types.length > 0 ? (
              <span>
                {filters.signal_types.map(t => filterLabels[t] ?? t).join(', ')}
              </span>
            ) : (
              <span>All signal types</span>
            )}
            {filters.min_score != null && (
              <span> · score ≥ {filters.min_score}</span>
            )}
          </div>
        </div>

        <form action={deleteAction}>
          <button
            type="submit"
            className="text-[11px] px-[10px] py-[4px] rounded-full cursor-pointer"
            style={{
              border: '0.5px solid var(--color-border-secondary)',
              color: 'var(--color-text-tertiary)',
              background: 'none',
            }}
          >
            Delete
          </button>
        </form>
      </div>

      {/* Feed */}
      <div className="flex items-center justify-between mb-[4px]">
        <div className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {signals.length} signals
        </div>
        <div className="font-mono text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
          SORTED BY FIT
        </div>
      </div>

      {signals.length === 0 ? (
        <div className="py-[48px] text-center">
          <p className="text-[13px]" style={{ color: 'var(--color-text-tertiary)' }}>
            No signals match these filters.
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

      {/* Pagination */}
      {(hasPrev || hasNext) && (
        <div
          className="flex items-center justify-between pt-[14px] text-[12px] font-mono"
          style={{ borderTop: '0.5px solid var(--color-border-tertiary)', color: 'var(--color-text-tertiary)' }}
        >
          <span>Page {page}</span>
          <div className="flex items-center gap-[12px]">
            {hasPrev && (
              <Link href={pageHref(page - 1)} className="inline-flex items-center gap-[4px]">
                <i className="ti ti-arrow-left" style={{ fontSize: '12px' }} aria-hidden="true" />
                Prev
              </Link>
            )}
            {hasNext && (
              <Link href={pageHref(page + 1)} className="inline-flex items-center gap-[4px]">
                Next
                <i className="ti ti-arrow-right" style={{ fontSize: '12px' }} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
