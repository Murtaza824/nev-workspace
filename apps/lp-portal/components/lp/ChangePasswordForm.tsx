'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
]

export function ChangePasswordForm() {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const allMet = REQUIREMENTS.every((r) => r.test(password))
  const passwordsMatch = confirm.length > 0 && password === confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allMet || !passwordsMatch) return
    setError(null)
    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess(true)
    setOpen(false)
    setPassword('')
    setConfirm('')
  }

  function handleCancel() {
    setOpen(false)
    setError(null)
    setPassword('')
    setConfirm('')
  }

  return (
    <div className="flex flex-col gap-3">
      {success && (
        <p className="font-inter text-caption text-accent-positive">
          Password updated successfully.
        </p>
      )}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full h-12 md:h-10 rounded-input border border-border-hairline bg-surface px-4 font-inter text-body text-ink-primary hover:bg-surface-warm transition-colors duration-200 text-left"
        >
          Change password
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="new-password"
              className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary"
            >
              New password
            </label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              className="w-full h-12 md:h-10 rounded-input border border-border-hairline bg-surface-warm px-3 font-inter text-body text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-ink-secondary"
            />
          </div>

          {/* Requirements checklist */}
          {password.length > 0 && (
            <ul className="flex flex-col gap-1.5 rounded-input border border-border-hairline bg-surface-warm px-4 py-3">
              {REQUIREMENTS.map((req) => {
                const met = req.test(password)
                return (
                  <li
                    key={req.label}
                    className={`flex items-center gap-2 font-inter text-caption transition-colors duration-150 ${
                      met ? 'text-accent-positive' : 'text-ink-tertiary'
                    }`}
                  >
                    <span className="w-3 shrink-0 text-center text-[10px]">
                      {met ? '✓' : '○'}
                    </span>
                    {req.label}
                  </li>
                )
              })}
            </ul>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="confirm-password"
              className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary"
            >
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              className="w-full h-12 md:h-10 rounded-input border border-border-hairline bg-surface-warm px-3 font-inter text-body text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-ink-secondary"
            />
            {confirm.length > 0 && !passwordsMatch && (
              <p className="font-inter text-caption text-accent-negative">
                Passwords do not match.
              </p>
            )}
          </div>

          {error && (
            <p className="font-inter text-caption text-accent-negative">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !allMet || !passwordsMatch}
              className="flex-1 h-12 md:h-10 rounded-input bg-ink-primary px-4 font-inter text-body text-canvas hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save password'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="h-12 md:h-10 rounded-input border border-border-hairline bg-surface px-4 font-inter text-body text-ink-primary hover:bg-surface-warm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
