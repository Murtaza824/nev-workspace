'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import { createClient } from '@/lib/supabase/client'

const REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
]

export default function SetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allMet = REQUIREMENTS.every((r) => r.test(password))
  const passwordsMatch = confirm.length > 0 && password === confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allMet || !passwordsMatch) return

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    router.replace('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-5 py-12 md:px-0">
      <div className="animate-fade-up w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo className="h-8 w-auto text-ink-primary" />
        </div>

        <p className="mt-4 text-center font-inter text-body text-ink-secondary">
          Set your password to continue
        </p>

        <div className="mt-8 rounded-card border border-border-hairline bg-surface p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* New password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-input border border-border-hairline bg-surface-warm px-3 pr-12 font-inter text-body text-ink-primary placeholder:text-ink-tertiary focus:border-ink-secondary focus:outline-none md:h-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 flex min-h-[44px] min-w-[44px] items-center justify-center font-inter text-caption text-ink-secondary hover:text-ink-primary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Requirements checklist — appears once they start typing */}
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

            {/* Confirm password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="confirm"
                className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary"
              >
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="h-12 w-full rounded-input border border-border-hairline bg-surface-warm px-3 font-inter text-body text-ink-primary placeholder:text-ink-tertiary focus:border-ink-secondary focus:outline-none md:h-10"
              />
              {confirm.length > 0 && !passwordsMatch && (
                <p className="font-inter text-caption text-accent-negative">
                  Passwords do not match.
                </p>
              )}
            </div>

            {error && (
              <p className="font-inter text-caption text-accent-negative" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !allMet || !passwordsMatch}
              className="mt-2 h-[52px] w-full rounded-input bg-ink-primary font-inter text-body font-medium text-canvas transition-opacity duration-200 ease-out hover:opacity-90 disabled:opacity-50 md:h-10"
            >
              {loading ? 'Saving…' : 'Set password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
