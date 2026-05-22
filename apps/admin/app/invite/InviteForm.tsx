'use client'

import { useActionState } from 'react'
import { inviteUser } from './actions'

type Tool = { id: string; name: string }

const ROLES = [
  { value: 'member', label: 'Member' },
  { value: 'admin', label: 'Admin' },
  { value: 'lp', label: 'LP' },
  { value: 'intern', label: 'Intern' },
]

export function InviteForm({ tools }: { tools: Tool[] }) {
  const [error, formAction, isPending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        await inviteUser(formData)
        return null
      } catch (e) {
        return e instanceof Error ? e.message : 'Something went wrong.'
      }
    },
    null,
  )

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="font-mono text-xs font-medium uppercase tracking-wider text-ink-secondary"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="off"
          className="h-10 w-full rounded-lg border border-[0.5px] border-[var(--color-border)] bg-surface px-3 font-inter text-sm text-ink-primary placeholder:text-ink-tertiary focus:border-ink-secondary focus:outline-none"
          placeholder="carter@neweraventures.com"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="role"
          className="font-mono text-xs font-medium uppercase tracking-wider text-ink-secondary"
        >
          Role
        </label>
        <select
          id="role"
          name="role"
          required
          defaultValue=""
          className="h-10 w-full rounded-lg border border-[0.5px] border-[var(--color-border)] bg-surface px-3 font-inter text-sm text-ink-primary focus:border-ink-secondary focus:outline-none"
        >
          <option value="" disabled>
            Select a role
          </option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-mono text-xs font-medium uppercase tracking-wider text-ink-secondary">
          Tool access
        </legend>
        <div className="flex flex-col gap-2 pt-1">
          {tools.map((tool) => (
            <label key={tool.id} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="app_access"
                value={tool.id}
                className="h-4 w-4 rounded border-[var(--color-border)] accent-ink-primary"
              />
              <span className="font-inter text-sm text-ink-primary">{tool.name}</span>
              <span className="font-mono text-xs text-ink-tertiary">{tool.id}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p className="font-inter text-xs text-accent-negative" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="h-10 rounded-lg bg-ink-primary font-inter text-sm font-medium text-canvas transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? 'Sending…' : 'Send invitation'}
      </button>
    </form>
  )
}
