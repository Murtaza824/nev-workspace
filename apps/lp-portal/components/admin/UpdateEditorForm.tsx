'use client'

import { useState, useTransition, useRef } from 'react'
import { MdEditor } from '@/components/admin/MdEditor'
import { PdfUpload } from '@/components/admin/PdfUpload'
import { createUpdate, saveUpdate } from '@/app/(admin)/admin/updates/actions'
import type { Update, PortfolioCompany } from '@/lib/types'

interface Props {
  update?: Update
  companies: PortfolioCompany[]
  mode: 'create' | 'edit'
}

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

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function UpdateEditorForm({ update, companies, mode }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<'draft' | 'publish' | null>(null)

  const [title, setTitle] = useState(update?.title ?? '')
  const [slug, setSlug] = useState(update?.slug ?? '')
  const [bodyMd, setBodyMd] = useState(update?.body_md ?? '')

  // Auto-excerpt: first 200 chars of body with markdown stripped
  const autoExcerpt = bodyMd.replace(/[#*_`[\]]/g, '').slice(0, 200)

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const t = e.target.value
    setTitle(t)
    if (mode === 'create') {
      setSlug(slugify(t))
    }
  }

  function submit(publish: boolean) {
    const form = formRef.current
    if (!form) return
    setError(null)
    setSuccess(null)
    setPendingAction(publish ? 'publish' : 'draft')
    const data = new FormData(form)
    data.set('title', title)
    data.set('slug', slug)
    data.set('body_md', bodyMd)

    startTransition(async () => {
      if (mode === 'create') {
        const result = await createUpdate(data, publish)
        if (result && 'error' in result) {
          setError(result.error)
          setPendingAction(null)
        }
        // On success, createUpdate redirects
      } else if (update) {
        const result = await saveUpdate(update.id, data, publish)
        if ('error' in result && result.error) {
          setError(result.error)
        } else {
          setSuccess(publish ? 'Published.' : 'Draft saved.')
          setTimeout(() => setSuccess(null), 2000)
        }
        setPendingAction(null)
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6">
      {/* Title + Slug */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Title" htmlFor="upd-title" required>
          <input
            id="upd-title"
            name="title"
            type="text"
            required
            value={title}
            onChange={handleTitleChange}
            className={inputClass}
          />
        </FormField>
        <FormField label="Slug" htmlFor="upd-slug" required>
          <input
            id="upd-slug"
            name="slug"
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </div>

      {/* Subtitle */}
      <FormField label="Subtitle" htmlFor="upd-subtitle">
        <input
          id="upd-subtitle"
          name="subtitle"
          type="text"
          defaultValue={update?.subtitle ?? ''}
          className={inputClass}
        />
      </FormField>

      {/* Body */}
      <div className="flex flex-col gap-1">
        <span className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
          Body
        </span>
        <MdEditor value={bodyMd} onChange={setBodyMd} />
        <input type="hidden" name="body_md" value={bodyMd} />
      </div>

      {/* Excerpt override */}
      <FormField label="Excerpt (override)" htmlFor="upd-excerpt">
        <textarea
          id="upd-excerpt"
          name="excerpt"
          rows={2}
          placeholder={autoExcerpt || 'Auto-generated from body…'}
          defaultValue={update?.excerpt ?? ''}
          className={`${inputClass} resize-y`}
        />
      </FormField>

      {/* Related company */}
      <FormField label="Related company" htmlFor="upd-company">
        <select
          id="upd-company"
          name="related_company_id"
          defaultValue={update?.related_company_id ?? ''}
          className={selectClass}
        >
          <option value="">— None —</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </FormField>

      {/* PDF upload */}
      <div className="flex flex-col gap-1">
        <span className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
          Attach PDF
        </span>
        <PdfUpload
          bucket="update-pdfs"
          folder={slug || 'unknown'}
          currentUrl={update?.pdf_url ?? null}
          fieldName="pdf_url"
        />
      </div>

      {error && <p className="font-inter text-body text-accent-negative">{error}</p>}
      {success && <p className="font-inter text-body text-accent-positive">{success}</p>}

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => submit(false)}
          className="rounded-pill bg-surface-warm border border-border-hairline px-4 py-2 font-inter text-body text-ink-secondary hover:text-ink-primary hover:border-white/20 transition-colors duration-200 disabled:opacity-50"
        >
          {isPending && pendingAction === 'draft' ? 'Saving…' : 'Save draft'}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => submit(true)}
          className="rounded-pill bg-surface-warm border border-border-hairline border-accent-positive/30 px-4 py-2 font-inter text-body text-accent-positive hover:border-accent-positive/60 transition-colors duration-200 disabled:opacity-50"
        >
          {isPending && pendingAction === 'publish' ? 'Publishing…' : 'Publish'}
        </button>
      </div>
    </form>
  )
}
