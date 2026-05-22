'use client'

import { useRef, useState, useEffect } from 'react'
import type { PortfolioCompany } from '@/lib/types'
import { formatMult } from '@/lib/format'

interface CostValueBarsProps {
  companies: PortfolioCompany[]
}

export function CostValueBars({ companies }: CostValueBarsProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Sort by multiple descending
  const sorted = [...companies].sort(
    (a, b) => (b.current_multiple ?? 1) - (a.current_multiple ?? 1)
  )

  const maxCurrentValue = Math.max(
    ...sorted.map((c) => (c.check_size ?? 0) * (c.current_multiple ?? 1)),
    1
  )

  return (
    <section ref={sectionRef} className="mt-16 md:mt-[64px]">
      <h2 className="font-fraunces text-[20px] leading-tight text-ink-primary mb-1 md:text-[22px]">
        Cost vs. Current value
      </h2>
      <p className="font-inter text-caption text-ink-secondary mb-6">
        Each row: capital invested, then current carrying value. Markups extend past the cost line.
      </p>

      <div className="flex flex-col gap-2">
        {sorted.map((company, i) => {
          const checkSize = company.check_size ?? 0
          const multiple = company.current_multiple ?? 1
          const currentValue = checkSize * multiple
          const costPct = (checkSize / maxCurrentValue) * 100
          const deltaPct = Math.max(0, ((currentValue - checkSize) / maxCurrentValue) * 100)

          return (
            <div key={company.id} className="flex items-center gap-3">
              {/* Company name */}
              <span className="w-[80px] md:w-[100px] shrink-0 font-inter text-body text-ink-primary truncate">
                {company.name}
              </span>

              {/* Bar track */}
              <div className="flex flex-1 h-5 items-stretch rounded-sm overflow-hidden">
                {/* Cost segment — appears immediately */}
                <div
                  className="bg-ink-tertiary h-full shrink-0"
                  style={{ width: `${costPct}%` }}
                  aria-hidden="true"
                />
                {/* Markup segment — animates in on scroll */}
                {deltaPct > 0 && (
                  <div
                    className="bg-accent-positive h-full shrink-0"
                    style={{
                      width: inView ? `${deltaPct}%` : '0%',
                      transition: inView
                        ? `width 600ms cubic-bezier(0.4, 0, 0.2, 1) ${i * 60}ms`
                        : 'none',
                    }}
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Multiple readout */}
              <span
                className={`w-[50px] md:w-[60px] shrink-0 text-right font-mono text-mono-sm ${multiple > 1.0 ? 'text-accent-positive' : 'text-ink-secondary'}`}
              >
                {formatMult(multiple)}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
