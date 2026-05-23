import Link from 'next/link'
import { createServerClient } from '@nev/db'
import {
  signalTypeColors,
  signalTypeLabels,
  filterLabels,
  FILTER_ORDER,
  getInitials,
  formatRelativeTime,
  getSourceIcon,
  getSourceLabel,
} from './lib/signal-helpers'

type SearchParams = Promise<{ filter?: string }>

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
  } | null
}

const ACTIVE_STATUSES = ['new', 'reviewed', 'pursuing'] as const

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const { filter } = await searchParams
  const activeFilter = FILTER_ORDER.includes(filter as (typeof FILTER_ORDER)[number])
    ? (filter as string)
    : null

  const supabase = await createServerClient()

  const feedQuery = supabase
    .from('sourcing_signals')
    .select(
      'id, signal_type, source, person_id, event_at, detected_at, summary, score, status, sourcing_people(id, full_name, current_title, current_company)'
    )
    .in('status', [...ACTIVE_STATUSES])
    .order('score', { ascending: false, nullsFirst: false })
    .limit(50)

  const [
    { data: rawSignals },
    { data: allSignalTypes },
    { count: signals24h },
    { count: highPriorityCount },
    { count: peopleCount },
    { count: watchlistCount },
  ] = await Promise.all([
    activeFilter ? feedQuery.eq('signal_type', activeFilter) : feedQuery,
    supabase
      .from('sourcing_signals')
      .select('signal_type')
      .in('status', [...ACTIVE_STATUSES]),
    supabase
      .from('sourcing_signals')
      .select('*', { count: 'exact', head: true })
      .gte('detected_at', new Date(Date.now() - 86_400_000).toISOString()),
    supabase
      .from('sourcing_signals')
      .select('*', { count: 'exact', head: true })
      .gte('score', 85)
      .in('status', [...ACTIVE_STATUSES]),
    supabase.from('sourcing_people').select('*', { count: 'exact', head: true }),
    supabase.from('sourcing_watchlists').select('*', { count: 'exact', head: true }),
  ])

  const signals = (rawSignals ?? []) as unknown as FeedSignal[]

  const filterCounts: Record<string, number> = {}
  for (const s of (allSignalTypes ?? []) as { signal_type: string }[]) {
    filterCounts[s.signal_type] = (filterCounts[s.signal_type] ?? 0) + 1
  }
  const totalCount = (allSignalTypes ?? []).length

  const personSignalCounts = new Map<string, number>()
  for (const s of signals) {
    if (s.person_id) {
      personSignalCounts.set(s.person_id, (personSignalCounts.get(s.person_id) ?? 0) + 1)
    }
  }

  const availableFilters = FILTER_ORDER.filter(type => (filterCounts[type] ?? 0) > 0)

  return (
    <main
      className="min-h-screen px-6 py-4"
      style={{ backgroundColor: 'var(--color-background-primary)' }}
    >
      {/* App header */}
      <div
        className="flex items-center justify-between pb-[14px]"
        style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}
      >
        <div className="flex items-center gap-[10px]">
          <div
            className="w-[30px] h-[30px] flex items-center justify-center font-mono text-[13px] font-medium flex-shrink-0"
            style={{
              borderRadius: '7px',
              background: 'var(--color-text-primary)',
              color: 'var(--color-background-primary)',
            }}
          >
            N
          </div>
          <div>
            <div className="text-[15px] font-medium leading-[1.2]">NEV Signal</div>
            <div
              className="font-mono text-[10px] mt-[2px] tracking-[0.08em]"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              SOURCING · LIVE
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-[14px] text-[12px]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <span className="inline-flex items-center gap-[6px]">
            <span
              className="inline-block w-[6px] h-[6px] rounded-full"
              style={{ background: 'var(--color-accent-green-dot)' }}
            />
            Streaming
          </span>
          <button aria-label="Search" className="leading-none cursor-pointer">
            <i className="ti ti-search" style={{ fontSize: '16px' }} aria-hidden="true" />
          </button>
          <button aria-label="Filter settings" className="leading-none cursor-pointer">
            <i className="ti ti-adjustments-horizontal" style={{ fontSize: '16px' }} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-[6px] pt-[14px] pb-[12px] flex-wrap">
        <Link
          href="/"
          className="inline-block px-[11px] py-[4px] rounded-full text-[12px] cursor-pointer"
          style={
            !activeFilter
              ? {
                  background: 'var(--color-text-primary)',
                  color: 'var(--color-background-primary)',
                }
              : {
                  background: 'transparent',
                  border: '0.5px solid var(--color-border-secondary)',
                  color: 'var(--color-text-secondary)',
                }
          }
        >
          All · {totalCount}
        </Link>

        {availableFilters.map(type => {
          const isActive = activeFilter === type
          return (
            <Link
              key={type}
              href={isActive ? '/' : `/?filter=${type}`}
              className="inline-block px-[11px] py-[4px] rounded-full text-[12px] cursor-pointer"
              style={
                isActive
                  ? {
                      background: 'var(--color-text-primary)',
                      color: 'var(--color-background-primary)',
                    }
                  : {
                      background: 'transparent',
                      border: '0.5px solid var(--color-border-secondary)',
                      color: 'var(--color-text-secondary)',
                    }
              }
            >
              {filterLabels[type] ?? type} · {filterCounts[type]}
            </Link>
          )
        })}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-[8px] mb-[1.25rem]">
        <MetricCard label="SIGNALS / 24H" value={signals24h ?? 0} />
        <MetricCard label="HIGH PRIORITY" value={highPriorityCount ?? 0} />
        <MetricCard label="TRACKED PEOPLE" value={peopleCount ?? 0} />
        <MetricCard label="WATCHLISTS" value={watchlistCount ?? 0} />
      </div>

      {/* Feed section header */}
      <div className="flex items-center justify-between mb-[4px]">
        <div className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {activeFilter ? `${filterLabels[activeFilter] ?? activeFilter} signals` : 'All signals'}
        </div>
        <div
          className="font-mono text-[11px]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          SORTED BY FIT
        </div>
      </div>

      {/* Feed */}
      {signals.length === 0 ? (
        <div className="py-[48px] text-center">
          <p className="text-[13px]" style={{ color: 'var(--color-text-tertiary)' }}>
            {activeFilter
              ? 'No signals match your filter.'
              : 'No signals yet. The first ingestion run will populate this feed.'}
          </p>
        </div>
      ) : (
        signals.map((signal, i) => {
          const colors = signalTypeColors[signal.signal_type] ?? signalTypeColors.job_change
          const person = signal.sourcing_people
          const name = person?.full_name ?? 'Unknown'
          const context = person?.current_title ?? person?.current_company ?? null
          const initials = getInitials(name)
          const signalCount = signal.person_id
            ? (personSignalCounts.get(signal.person_id) ?? 1)
            : 1
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
              style={!isLast ? { borderBottom: '0.5px solid var(--color-border-tertiary)' } : undefined}
            >
              <div
                className={`w-[36px] h-[36px] ${signal.person_id ? 'rounded-full' : 'rounded-[7px]'} flex items-center justify-center text-[12px] font-medium flex-shrink-0`}
                style={{ background: colors.bg, color: colors.fg }}
              >
                {initials}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header row */}
                <div className="flex items-center gap-[6px] mb-[3px] flex-wrap">
                  <span className="text-[14px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
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

                {/* Summary */}
                {signal.summary && (
                  <div
                    className="text-[13px] leading-[1.5]"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {signal.summary}
                  </div>
                )}

                {/* Source attribution row */}
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
                  <span>·</span>
                  <span>
                    {signalCount} {signalCount === 1 ? 'SIGNAL' : 'SIGNALS'}
                  </span>
                </div>
              </div>

              {/* Score */}
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

      {/* Bottom action bar */}
      <div
        className="flex items-center justify-between pt-[14px] text-[12px]"
        style={{
          borderTop: '0.5px solid var(--color-border-tertiary)',
          color: 'var(--color-text-tertiary)',
        }}
      >
        <span>
          Showing {signals.length} of {totalCount}
        </span>
        <span className="font-mono">⌘K to search · ⌘N new watchlist</span>
      </div>
    </main>
  )
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded-[8px]"
      style={{
        background: 'var(--color-background-secondary)',
        padding: '10px 12px',
      }}
    >
      <div
        className="font-mono text-[10px] tracking-[0.06em]"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {label}
      </div>
      <div className="font-mono text-[20px] font-medium mt-[2px]">{value}</div>
    </div>
  )
}
