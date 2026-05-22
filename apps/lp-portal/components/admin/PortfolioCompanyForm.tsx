'use client'

import { useState, useTransition } from 'react'
import { PdfUpload } from '@/components/admin/PdfUpload'
import { createPortfolioCompany, updatePortfolioCompany } from '@/app/(admin)/admin/portfolio/actions'
import type { PortfolioCompany } from '@/lib/types'

interface Props {
  company?: PortfolioCompany
  mode: 'create' | 'edit'
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function PortfolioCompanyForm({ company, mode }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(company?.name ?? '')
  const [slug, setSlug] = useState(company?.slug ?? '')
  const [proRata, setProRata] = useState(company?.pro_rata_rights ?? false)

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const n = e.target.value
    setName(n)
    if (mode === 'create') {
      setSlug(slugify(n))
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const form = e.currentTarget
    const data = new FormData(form)
    // Override with controlled state
    data.set('name', name)
    data.set('slug', slug)
    data.set('pro_rata_rights', proRata ? 'true' : 'false')

    startTransition(async () => {
      if (mode === 'create') {
        const result = await createPortfolioCompany(data)
        if (result && 'error' in result) {
          setError(result.error)
        }
        // On success, createPortfolioCompany redirects
      } else if (company) {
        const result = await updatePortfolioCompany(company.id, data)
        if ('error' in result && result.error) {
          setError(result.error)
        } else {
          setSuccess(true)
          setTimeout(() => setSuccess(false), 2000)
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Name + Slug */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Company name" htmlFor="pc-name" required>
          <input
            id="pc-name"
            name="name"
            type="text"
            required
            value={name}
            onChange={handleNameChange}
            className={inputClass}
          />
        </FormField>
        <FormField label="Slug" htmlFor="pc-slug" required>
          <input
            id="pc-slug"
            name="slug"
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </div>

      {/* Stage + Status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Stage" htmlFor="pc-stage">
          <select id="pc-stage" name="stage" defaultValue={company?.stage ?? ''} className={selectClass}>
            <option value="">— Select stage —</option>
            <option value="Pre-Seed">Pre-Seed</option>
            <option value="First Check">First Check</option>
            <option value="Seed">Seed</option>
            <option value="Series A">Series A</option>
          </select>
        </FormField>
        <FormField label="Status" htmlFor="pc-status">
          <select id="pc-status" name="status" defaultValue={company?.status ?? 'active'} className={selectClass}>
            <option value="active">Active</option>
            <option value="exited">Exited</option>
            <option value="written_off">Written off</option>
          </select>
        </FormField>
      </div>

      {/* One-liner + Sector + Website */}
      <FormField label="One-liner" htmlFor="pc-one-liner">
        <input
          id="pc-one-liner"
          name="one_liner"
          type="text"
          defaultValue={company?.one_liner ?? ''}
          className={inputClass}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Sector" htmlFor="pc-sector">
          <input
            id="pc-sector"
            name="sector"
            type="text"
            defaultValue={company?.sector ?? ''}
            className={inputClass}
          />
        </FormField>
        <FormField label="Website" htmlFor="pc-website">
          <input
            id="pc-website"
            name="website"
            type="url"
            defaultValue={company?.website ?? ''}
            placeholder="https://"
            className={inputClass}
          />
        </FormField>
      </div>

      {/* Financial fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <FormField label="Invested date" htmlFor="pc-invested-date">
          <input
            id="pc-invested-date"
            name="invested_date"
            type="date"
            defaultValue={company?.invested_date ?? ''}
            className={inputClass}
          />
        </FormField>
        <FormField label="Check size ($)" htmlFor="pc-check-size">
          <input
            id="pc-check-size"
            name="check_size"
            type="number"
            min="0"
            step="1"
            defaultValue={company?.check_size ?? ''}
            className={`${inputClass} font-mono`}
          />
        </FormField>
        <FormField label="Entry valuation ($)" htmlFor="pc-entry-val">
          <input
            id="pc-entry-val"
            name="entry_valuation"
            type="number"
            min="0"
            step="1"
            defaultValue={company?.entry_valuation ?? ''}
            className={`${inputClass} font-mono`}
          />
        </FormField>
        <FormField label="Ownership (%)" htmlFor="pc-ownership">
          <input
            id="pc-ownership"
            name="ownership_pct"
            type="number"
            min="0"
            max="100"
            step="0.01"
            defaultValue={company?.ownership_pct ?? ''}
            className={`${inputClass} font-mono`}
          />
        </FormField>
        <FormField label="Current valuation ($)" htmlFor="pc-current-val">
          <input
            id="pc-current-val"
            name="current_valuation"
            type="number"
            min="0"
            step="1"
            defaultValue={company?.current_valuation ?? ''}
            className={`${inputClass} font-mono`}
          />
        </FormField>
        <FormField label="Current multiple" htmlFor="pc-multiple">
          <input
            id="pc-multiple"
            name="current_multiple"
            type="number"
            min="0"
            step="0.01"
            defaultValue={company?.current_multiple ?? ''}
            className={`${inputClass} font-mono`}
          />
        </FormField>
      </div>

      {/* Pro-rata rights */}
      <div className="flex items-center gap-3">
        <input
          id="pc-pro-rata"
          name="pro_rata_rights_check"
          type="checkbox"
          checked={proRata}
          onChange={(e) => setProRata(e.target.checked)}
          className="h-4 w-4 rounded border-border-hairline bg-surface-warm"
        />
        <label htmlFor="pc-pro-rata" className="font-inter text-body text-ink-primary">
          Pro-rata rights
        </label>
      </div>

      {/* Thesis */}
      <FormField label="Thesis" htmlFor="pc-thesis">
        <textarea
          id="pc-thesis"
          name="thesis"
          rows={3}
          defaultValue={company?.thesis ?? ''}
          className={`${inputClass} resize-y`}
        />
      </FormField>

      {/* Memo PDF */}
      <div className="flex flex-col gap-1">
        <span className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
          Investment memo (PDF)
        </span>
        <PdfUpload
          bucket="memos"
          folder={slug || 'unknown'}
          currentUrl={company?.memo_pdf_url ?? null}
          fieldName="memo_pdf_url"
        />
      </div>

      {error && <p className="font-inter text-body text-accent-negative">{error}</p>}
      {success && <p className="font-inter text-body text-accent-positive">Saved.</p>}

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-pill bg-surface-warm border border-border-hairline px-4 py-2 font-inter text-body text-ink-primary hover:border-white/20 transition-colors duration-200 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : mode === 'create' ? 'Create company' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

// ── Internal helpers ────────────────────────────────────────

const inputClass =
  'w-full rounded-input border border-border-hairline bg-surface-warm px-3 py-2 font-inter text-body text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-white/30'

const selectClass =
  'w-full rounded-input border border-border-hairline bg-surface-warm px-3 py-2 font-inter text-body text-ink-primary focus:outline-none focus:border-white/30'

function FormField({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
        {label}
        {required && <span className="ml-1 text-accent-negative">*</span>}
      </label>
      {children}
    </div>
  )
}
