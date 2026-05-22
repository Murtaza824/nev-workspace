'use client'

import { useState, useTransition } from 'react'
import { inviteLP } from '@/app/(admin)/admin/users/actions'

export function InviteLPForm() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const form = e.currentTarget
    const data = new FormData(form)
    startTransition(async () => {
      const result = await inviteLP(data)
      if ('error' in result && result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        form.reset()
        setTimeout(() => {
          setOpen(false)
          setSuccess(false)
        }, 1500)
      }
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-pill bg-surface-warm border border-border-hairline px-4 py-2 font-inter text-body text-ink-primary hover:border-white/20 transition-colors duration-200"
      >
        {open ? 'Cancel' : 'Invite LP'}
      </button>

      {open && (
        <div className="mt-4 rounded-card border border-border-hairline bg-surface p-6">
          <h2 className="font-fraunces text-heading text-ink-primary mb-4">Invite a limited partner</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="invite-email" className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
                  Email
                </label>
                <input
                  id="invite-email"
                  name="email"
                  type="email"
                  required
                  placeholder="lp@example.com"
                  className="rounded-input border border-border-hairline bg-surface-warm px-3 py-2 font-inter text-body text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-white/30"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="invite-full-name" className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
                  Full name
                </label>
                <input
                  id="invite-full-name"
                  name="full_name"
                  type="text"
                  placeholder="Jane Smith"
                  className="rounded-input border border-border-hairline bg-surface-warm px-3 py-2 font-inter text-body text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-white/30"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="invite-commitment" className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
                  Commitment ($)
                </label>
                <input
                  id="invite-commitment"
                  name="commitment_amount"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="250000"
                  className="rounded-input border border-border-hairline bg-surface-warm px-3 py-2 font-mono text-mono-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            {error && (
              <p className="font-inter text-body text-accent-negative">{error}</p>
            )}
            {success && (
              <p className="font-inter text-body text-accent-positive">Invite sent.</p>
            )}

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-pill bg-surface-warm border border-border-hairline px-4 py-2 font-inter text-body text-ink-primary hover:border-white/20 transition-colors duration-200 disabled:opacity-50"
              >
                {isPending ? 'Sending…' : 'Send invite'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
