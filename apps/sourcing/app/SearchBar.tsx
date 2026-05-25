'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useRef, useTransition } from 'react'

const SCORE_OPTIONS = [
  { label: 'Any score', value: '' },
  { label: '50+', value: '50' },
  { label: '75+', value: '75' },
  { label: '85+', value: '85' },
]

export function SearchBar({
  initialQ,
  initialMinScore,
}: {
  initialQ: string
  initialMinScore: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function buildUrl(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    // Reset to page 1 on any filter change
    params.delete('page')
    return `/?${params.toString()}`
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      startTransition(() => router.push(buildUrl({ q })))
    }, 300)
  }

  function handleScoreChange(e: React.ChangeEvent<HTMLSelectElement>) {
    startTransition(() => router.push(buildUrl({ min_score: e.target.value })))
  }

  return (
    <div
      className="flex items-center gap-[8px] pb-[10px]"
      style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}
    >
      <div
        className="flex items-center gap-[8px] flex-1 rounded-[8px] px-[10px] py-[6px]"
        style={{
          background: 'var(--color-background-secondary)',
          border: '0.5px solid var(--color-border-secondary)',
        }}
      >
        <i
          className="ti ti-search flex-shrink-0"
          style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}
          aria-hidden="true"
        />
        <input
          type="text"
          defaultValue={initialQ}
          onChange={handleSearch}
          placeholder="Search by name or summary..."
          className="flex-1 text-[13px] bg-transparent outline-none"
          style={{ color: 'var(--color-text-primary)' }}
          autoFocus
        />
      </div>

      <select
        defaultValue={initialMinScore}
        onChange={handleScoreChange}
        className="text-[12px] font-mono rounded-[8px] px-[10px] py-[7px] cursor-pointer"
        style={{
          background: 'var(--color-background-secondary)',
          border: '0.5px solid var(--color-border-secondary)',
          color: 'var(--color-text-secondary)',
          outline: 'none',
        }}
        aria-label="Minimum score filter"
      >
        {SCORE_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
