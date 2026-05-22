'use client'

import { useState, useTransition } from 'react'
import { updateFund } from '@/app/(admin)/admin/fund/actions'
import { formatUSD } from '@/lib/format'
import type { Fund, PortfolioCompany } from '@/lib/types'

interface Props {
  fund: Fund
  companies: PortfolioCompany[]
}

const inputClass =
  'w-full rounded-input border border-border-hairline bg-surface-warm px-3 py-2 font-inter text-body text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-white/30'

function FormField({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
        {label}
      </label>
      {children}
      {hint && <p className="font-inter text-caption text-ink-tertiary">{hint}</p>}
    </div>
  )
}

export function FundForm({ fund, companies }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Auto-computed totals
  const computedDeployed = companies.reduce((sum, c) => sum + (c.check_size ?? 0), 0)
  const computedCurrentValue = companies.reduce(
    (sum, c) => sum + (c.check_size != null && c.current_multiple != null ? c.check_size * c.current_multiple : 0),
    0
  )

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const data = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateFund(fund.id, data)
      if ('error' in result && result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2000)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Fund name + vintage */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Fund name" htmlFor="fund-name">
          <input
            id="fund-name"
            name="name"
            type="text"
            defaultValue={fund.name}
            className={inputClass}
          />
        </FormField>
        <FormField label="Vintage" htmlFor="fund-vintage">
          <input
            id="fund-vintage"
            name="vintage"
            type="number"
            min="2000"
            max="2100"
            step="1"
            defaultValue={fund.vintage ?? ''}
            className={`${inputClass} font-mono`}
          />
        </FormField>
      </div>

      {/* Committed + Called */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Total committed ($)" htmlFor="fund-committed">
          <input
            id="fund-committed"
            name="total_committed"
            type="number"
            min="0"
            step="0.01"
            defaultValue={fund.total_committed ?? ''}
            className={`${inputClass} font-mono`}
          />
        </FormField>
        <FormField label="Total called ($)" htmlFor="fund-called">
          <input
            id="fund-called"
            name="total_called"
            type="number"
            min="0"
            step="0.01"
            defaultValue={fund.total_called ?? ''}
            className={`${inputClass} font-mono`}
          />
        </FormField>
      </div>

      {/* Deployed — auto-computed + override */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Total deployed ($)"
          htmlFor="fund-deployed"
          hint={`Auto-computed from portfolio: ${formatUSD(computedDeployed)}`}
        >
          <input
            id="fund-deployed"
            name="total_deployed"
            type="number"
            min="0"
            step="0.01"
            defaultValue={fund.total_deployed ?? computedDeployed}
            className={`${inputClass} font-mono`}
          />
        </FormField>

        {/* Current value — auto-computed + override */}
        <FormField
          label="Total current value ($)"
          htmlFor="fund-current-value"
          hint={`Auto-computed from portfolio: ${formatUSD(computedCurrentValue)}`}
        >
          <input
            id="fund-current-value"
            name="total_current_value"
            type="number"
            min="0"
            step="0.01"
            defaultValue={fund.total_current_value ?? computedCurrentValue}
            className={`${inputClass} font-mono`}
          />
        </FormField>
      </div>

      {/* As-of date */}
      <FormField label="As of date" htmlFor="fund-as-of">
        <input
          id="fund-as-of"
          name="as_of_date"
          type="date"
          defaultValue={fund.as_of_date ?? ''}
          className={inputClass}
        />
      </FormField>

      {error && <p className="font-inter text-body text-accent-negative">{error}</p>}
      {success && <p className="font-inter text-body text-accent-positive">Fund updated.</p>}

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-pill bg-surface-warm border border-border-hairline px-4 py-2 font-inter text-body text-ink-primary hover:border-white/20 transition-colors duration-200 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save fund'}
        </button>
      </div>
    </form>
  )
}
