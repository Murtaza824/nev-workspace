'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatUSD, formatMult, formatDate } from '@/lib/format'
import { StagePill } from '@/components/ui/StagePill'
import type { PortfolioCompany } from '@/lib/types'

type SortOption = 'recent' | 'largest' | 'multiple'

interface PortfolioMobileListProps {
  companies: PortfolioCompany[]
}

export function PortfolioMobileList({ companies }: PortfolioMobileListProps) {
  const [sort, setSort] = useState<SortOption>('recent')

  const sorted = [...companies].sort((a, b) => {
    if (sort === 'recent') {
      const da = a.invested_date ? new Date(a.invested_date).getTime() : 0
      const db = b.invested_date ? new Date(b.invested_date).getTime() : 0
      return db - da
    }
    if (sort === 'largest') {
      return (b.check_size ?? 0) - (a.check_size ?? 0)
    }
    // highest multiple
    return (b.current_multiple ?? 0) - (a.current_multiple ?? 0)
  })

  return (
    <div>
      {/* Sort control */}
      <div className="mb-4">
        <label htmlFor="portfolio-sort" className="sr-only">
          Sort portfolio
        </label>
        <select
          id="portfolio-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="rounded-input border border-border-hairline bg-surface px-3 py-3 font-inter text-body text-ink-primary focus:outline-none focus:ring-2 focus:ring-accent-positive"
        >
          <option value="recent">Most recent</option>
          <option value="largest">Largest position</option>
          <option value="multiple">Highest multiple</option>
        </select>
      </div>

      {/* Card list */}
      <ul className="flex flex-col gap-3">
        {sorted.map((company) => {
          const multiple = company.current_multiple ?? 1
          return (
            <li key={company.id}>
              <Link
                href={`/portfolio/${company.slug}`}
                className="block rounded-card border border-border-hairline p-4 active:bg-surface-warm transition-colors duration-200 cursor-pointer"
              >
                {/* Row 1: name + stage pill */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="font-inter font-medium text-[17px] text-ink-primary leading-tight">
                    {company.name}
                  </span>
                  <StagePill stage={company.stage} />
                </div>

                {/* Row 2: check + multiple */}
                <div className="flex items-center gap-4 mb-1">
                  <span className="font-mono text-mono-md text-ink-primary">
                    {company.check_size ? formatUSD(company.check_size) : '—'}
                  </span>
                  <span
                    className={`font-mono text-mono-md ${multiple > 1.0 ? 'text-accent-positive' : 'text-ink-primary'}`}
                  >
                    {formatMult(multiple)}
                  </span>
                </div>

                {/* Row 3: date + ownership % */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-mono-sm text-ink-secondary">
                    {company.invested_date ? formatDate(company.invested_date) : '—'}
                  </span>
                  <span className="font-mono text-mono-sm text-ink-secondary">
                    {company.ownership_pct != null
                      ? `${company.ownership_pct.toFixed(2)}%`
                      : '—'}
                  </span>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
