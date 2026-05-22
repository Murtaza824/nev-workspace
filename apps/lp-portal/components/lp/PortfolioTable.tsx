import Link from 'next/link'
import { formatUSD, formatMult, formatDate } from '@/lib/format'
import { StagePill } from '@/components/ui/StagePill'
import type { PortfolioCompany, CoInvestor } from '@/lib/types'

interface PortfolioTableProps {
  companies: PortfolioCompany[]
  coInvestors: Record<string, CoInvestor[]>
}

export function PortfolioTable({ companies, coInvestors }: PortfolioTableProps) {
  // Footer totals
  const totalCheckSize = companies.reduce((sum, c) => sum + (c.check_size ?? 0), 0)
  // Company valuations for display (not NEV's position)
  const totalCompanyVal = companies.reduce((sum, c) => sum + (c.current_valuation ?? 0), 0)
  // NEV position values for MOIC calculation
  const totalNEVCurrentValue = companies.reduce(
    (sum, c) => sum + (c.check_size ?? 0) * (c.current_multiple ?? 1),
    0
  )
  const weightedMoic = totalCheckSize > 0 ? totalNEVCurrentValue / totalCheckSize : 0

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-border-hairline">
            {(
              [
                ['Company', 'text-left min-w-[140px] pr-6'],
                ['Stage', 'text-left pr-4'],
                ['Date', 'text-right pr-4'],
                ['Check', 'text-right pr-4'],
                ['Entry val', 'text-right pr-4'],
                ['Own %', 'text-right pr-4'],
                ['Company val', 'text-right pr-4'],
                ['Mult', 'text-right pr-4'],
                ['Pro rata', 'text-right pr-4'],
                ['Co-investors', 'text-left'],
              ] as [string, string][]
            ).map(([label, extra]) => (
              <th
                key={label}
                className={`pb-3 pt-2 font-inter text-caption uppercase tracking-[0.08em] text-ink-tertiary whitespace-nowrap ${extra}`}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => {
            const currentVal = (company.check_size ?? 0) * (company.current_multiple ?? 1)
            const multiple = company.current_multiple ?? 1
            const coInvs = coInvestors[company.id] ?? []

            return (
              <tr
                key={company.id}
                className="border-b border-border-hairline hover:bg-surface-warm transition-colors duration-200"
              >
                {/* Company */}
                <td className="py-4 pr-6">
                  <Link
                    href={`/portfolio/${company.slug}`}
                    className="font-inter font-medium text-body text-ink-primary hover:text-accent-positive transition-colors"
                  >
                    {company.name}
                  </Link>
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block ml-1.5 align-middle text-ink-tertiary hover:text-ink-secondary transition-colors"
                      aria-label={`${company.name} website`}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M3.5 3a.5.5 0 000 1H7.29L2.15 9.15a.5.5 0 00.7.7L8 4.71V8.5a.5.5 0 001 0v-5a.5.5 0 00-.5-.5h-5z" />
                      </svg>
                    </a>
                  )}
                </td>
                {/* Stage */}
                <td className="py-4 pr-4">
                  <StagePill stage={company.stage} />
                </td>
                {/* Date */}
                <td className="py-4 pr-4 font-mono text-mono-md text-ink-primary text-right whitespace-nowrap">
                  {company.invested_date ? formatDate(company.invested_date) : '—'}
                </td>
                {/* Check */}
                <td className="py-4 pr-4 font-mono text-mono-md text-ink-primary text-right whitespace-nowrap">
                  {company.check_size ? formatUSD(company.check_size) : '—'}
                </td>
                {/* Entry val */}
                <td className="py-4 pr-4 font-mono text-mono-md text-ink-primary text-right whitespace-nowrap">
                  {company.entry_valuation ? formatUSD(company.entry_valuation) : '—'}
                </td>
                {/* Own % */}
                <td className="py-4 pr-4 font-mono text-mono-md text-ink-primary text-right whitespace-nowrap">
                  {company.ownership_pct != null
                    ? `${company.ownership_pct.toFixed(2)}%`
                    : '—'}
                </td>
                {/* Company val */}
                <td className="py-4 pr-4 font-mono text-mono-md text-ink-primary text-right whitespace-nowrap">
                  {company.current_valuation ? formatUSD(company.current_valuation) : '—'}
                </td>
                {/* Mult */}
                <td
                  className={`py-4 pr-4 font-mono text-mono-md text-right whitespace-nowrap ${multiple > 1.0 ? 'text-accent-positive' : 'text-ink-primary'}`}
                >
                  {formatMult(multiple)}
                </td>
                {/* Pro rata */}
                <td className="py-4 pr-4 text-right whitespace-nowrap">
                  {company.pro_rata_rights ? (
                    <span className="inline-block rounded-pill bg-pill-mint-bg px-2 py-0.5 font-inter text-caption text-pill-mint-ink">
                      Yes
                    </span>
                  ) : (
                    <span className="inline-block rounded-pill bg-pill-slate-bg px-2 py-0.5 font-inter text-caption text-pill-slate-ink">
                      No
                    </span>
                  )}
                </td>
                {/* Co-investors */}
                <td className="py-4 font-inter text-caption text-ink-secondary">
                  {coInvs.length > 0
                    ? coInvs.map((ci) => ci.name).join(', ')
                    : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-border-hairline">
            <td
              colSpan={3}
              className="py-4 pr-4 font-inter font-medium text-body text-ink-primary"
            >
              Totals
            </td>
            <td className="py-4 pr-4 font-mono text-mono-md text-ink-primary text-right whitespace-nowrap">
              {formatUSD(totalCheckSize)}
            </td>
            <td colSpan={3} />
            <td className="py-4 pr-4 font-mono text-mono-md text-accent-positive text-right whitespace-nowrap">
              {formatMult(weightedMoic)}
            </td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
