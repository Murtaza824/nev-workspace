'use client'

import { useState, useTransition } from 'react'
import { logValuationEvent } from '@/app/(admin)/admin/portfolio/actions'

interface Props {
  companyId: string
  slug: string
}

const inputClass =
  'w-full rounded-input border border-border-hairline bg-surface-warm px-3 py-2 font-inter text-body text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-white/30'

const selectClass =
  'w-full rounded-input border border-border-hairline bg-surface-warm px-3 py-2 font-inter text-body text-ink-primary focus:outline-none focus:border-white/30'

export function ValuationEventForm({ companyId, slug }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const form = e.currentTarget
    const data = new FormData(form)
    data.set('slug', slug)
    startTransition(async () => {
      const result = await logValuationEvent(companyId, data)
      if ('error' in result && result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        form.reset()
        setTimeout(() => setSuccess(false), 2000)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="ve-date" className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
            Event date <span className="text-accent-negative">*</span>
          </label>
          <input id="ve-date" name="event_date" type="date" required className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="ve-type" className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
            Event type
          </label>
          <select id="ve-type" name="event_type" className={selectClass}>
            <option value="">— Select type —</option>
            <option value="initial">Initial</option>
            <option value="markup">Markup</option>
            <option value="markdown">Markdown</option>
            <option value="exit">Exit</option>
            <option value="writedown">Writedown</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="ve-company-val" className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
            Company valuation ($)
          </label>
          <input
            id="ve-company-val"
            name="new_company_valuation"
            type="number"
            min="0"
            step="1"
            className={`${inputClass} font-mono`}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="ve-position-val" className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
            Position value ($)
          </label>
          <input
            id="ve-position-val"
            name="new_position_value"
            type="number"
            min="0"
            step="1"
            className={`${inputClass} font-mono`}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="ve-multiple" className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
            Multiple
          </label>
          <input
            id="ve-multiple"
            name="multiple"
            type="number"
            min="0"
            step="0.01"
            className={`${inputClass} font-mono`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="ve-note" className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
          Note
        </label>
        <textarea
          id="ve-note"
          name="note"
          rows={2}
          className={`${inputClass} resize-y`}
        />
      </div>

      {error && <p className="font-inter text-body text-accent-negative">{error}</p>}
      {success && <p className="font-inter text-body text-accent-positive">Event logged.</p>}

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-pill bg-surface-warm border border-border-hairline px-4 py-2 font-inter text-body text-ink-primary hover:border-white/20 transition-colors duration-200 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Log event'}
        </button>
      </div>
    </form>
  )
}
