'use client'

import { useState, useTransition } from 'react'
import { inviteTeamMember } from '@/app/(lp)/account/actions'

export function InviteTeamMemberForm() {
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
      const result = await inviteTeamMember(data)
      if ('error' in result && result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        form.reset()
        setTimeout(() => {
          setOpen(false)
          setSuccess(false)
        }, 2000)
      }
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-pill border border-border-hairline bg-surface-warm px-4 py-2 font-inter text-body text-ink-primary hover:border-white/20 transition-colors duration-200"
      >
        {open ? 'Cancel' : 'Add team member'}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="team-email"
                className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary"
              >
                Email
              </label>
              <input
                id="team-email"
                name="email"
                type="email"
                required
                placeholder="colleague@example.com"
                className="h-10 rounded-input border border-border-hairline bg-surface-warm px-3 font-inter text-body text-ink-primary placeholder:text-ink-tertiary focus:border-white/30 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="team-full-name"
                className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary"
              >
                Full name
              </label>
              <input
                id="team-full-name"
                name="full_name"
                type="text"
                placeholder="Jane Smith"
                className="h-10 rounded-input border border-border-hairline bg-surface-warm px-3 font-inter text-body text-ink-primary placeholder:text-ink-tertiary focus:border-white/30 focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <p className="font-inter text-caption text-accent-negative" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="font-inter text-caption text-accent-positive" role="status">
              Invite sent.
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-pill border border-border-hairline bg-surface-warm px-4 py-2 font-inter text-body text-ink-primary hover:border-white/20 transition-colors duration-200 disabled:opacity-50"
            >
              {isPending ? 'Sending…' : 'Send invite'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
