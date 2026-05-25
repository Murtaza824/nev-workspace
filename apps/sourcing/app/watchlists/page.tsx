import Link from 'next/link'
import { createServerClient } from '@nev/db'
import { createWatchlist } from '@/app/actions/watchlists'
import { filterLabels, FILTER_ORDER } from '@/app/lib/signal-helpers'
import type { WatchlistFilters } from '@/app/lib/types'

type Watchlist = {
  id: string
  name: string
  filters: WatchlistFilters
  created_at: string
}

export default async function WatchlistsPage() {
  const supabase = await createServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawWatchlists } = await (supabase.from('sourcing_watchlists') as any)
    .select('id, name, filters, created_at')
    .order('created_at', { ascending: false })

  const watchlists = (rawWatchlists ?? []) as Watchlist[]

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

      <div
        className="pb-[14px] mb-[20px]"
        style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}
      >
        <div className="text-[17px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
          Watchlists
        </div>
        <div className="text-[12px] mt-[2px]" style={{ color: 'var(--color-text-tertiary)' }}>
          Saved filters that surface specific signals on demand.
        </div>
      </div>

      {/* Existing watchlists */}
      {watchlists.length > 0 && (
        <section className="mb-[28px]">
          <div className="flex flex-col">
            {watchlists.map((wl, i) => {
              const filters = wl.filters ?? {}
              const hasTypes = filters.signal_types && filters.signal_types.length > 0
              const hasScore = filters.min_score != null

              return (
                <Link
                  key={wl.id}
                  href={`/watchlists/${wl.id}`}
                  className="flex items-center justify-between py-[12px]"
                  style={
                    i < watchlists.length - 1
                      ? { borderBottom: '0.5px solid var(--color-border-tertiary)' }
                      : undefined
                  }
                >
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[14px] font-medium mb-[2px]"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {wl.name}
                    </div>
                    <div
                      className="font-mono text-[11px]"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {hasTypes && (
                        <span>
                          {filters.signal_types!
                            .map(t => filterLabels[t] ?? t)
                            .join(', ')}
                        </span>
                      )}
                      {hasTypes && hasScore && <span> · </span>}
                      {hasScore && <span>score ≥ {filters.min_score}</span>}
                      {!hasTypes && !hasScore && <span>No filters — all signals</span>}
                    </div>
                  </div>
                  <i
                    className="ti ti-chevron-right flex-shrink-0"
                    style={{ fontSize: '14px', color: 'var(--color-text-tertiary)' }}
                    aria-hidden="true"
                  />
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Create form */}
      <section>
        <div
          className="font-mono text-[10px] tracking-[0.06em] mb-[14px]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {watchlists.length === 0 ? 'CREATE YOUR FIRST WATCHLIST' : 'NEW WATCHLIST'}
        </div>

        <form action={createWatchlist} className="flex flex-col gap-[14px]">
          {/* Name */}
          <div>
            <label
              htmlFor="wl-name"
              className="font-mono text-[10px] tracking-[0.06em] block mb-[6px]"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              NAME
            </label>
            <input
              id="wl-name"
              name="name"
              type="text"
              required
              placeholder="e.g. Stealth founders"
              className="w-full text-[13px] rounded-[8px] px-[12px] py-[9px]"
              style={{
                background: 'var(--color-background-secondary)',
                color: 'var(--color-text-primary)',
                border: '0.5px solid var(--color-border-secondary)',
                outline: 'none',
              }}
            />
          </div>

          {/* Signal type filters */}
          <div>
            <div
              className="font-mono text-[10px] tracking-[0.06em] mb-[8px]"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              SIGNAL TYPES (leave unchecked for all)
            </div>
            <div className="flex flex-wrap gap-[6px]">
              {FILTER_ORDER.map(type => (
                <label
                  key={type}
                  className="inline-flex items-center gap-[6px] px-[10px] py-[4px] rounded-full text-[12px] cursor-pointer"
                  style={{
                    border: '0.5px solid var(--color-border-secondary)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <input
                    type="checkbox"
                    name="signal_type"
                    value={type}
                    className="w-[12px] h-[12px]"
                  />
                  {filterLabels[type] ?? type}
                </label>
              ))}
            </div>
          </div>

          {/* Min score */}
          <div>
            <label
              htmlFor="wl-min-score"
              className="font-mono text-[10px] tracking-[0.06em] block mb-[6px]"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              MIN SCORE (0–100, leave blank for all)
            </label>
            <input
              id="wl-min-score"
              name="min_score"
              type="number"
              min="0"
              max="100"
              placeholder="e.g. 75"
              className="w-[120px] text-[13px] font-mono rounded-[8px] px-[12px] py-[9px]"
              style={{
                background: 'var(--color-background-secondary)',
                color: 'var(--color-text-primary)',
                border: '0.5px solid var(--color-border-secondary)',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <button
              type="submit"
              className="text-[12px] px-[14px] py-[6px] rounded-full cursor-pointer"
              style={{
                background: 'var(--color-text-primary)',
                color: 'var(--color-background-primary)',
              }}
            >
              Create watchlist
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
