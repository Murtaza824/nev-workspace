'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const redirectTo = `${window.location.origin}/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
    })

    setLoading(false)

    if (otpError) {
      setError('Something went wrong. Check the email address and try again.')
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center">
        <p className="font-inter text-sm text-ink-primary">
          Check your inbox for a sign-in link.
        </p>
        <p className="mt-2 font-inter text-sm text-ink-tertiary">
          Sent to <span className="font-mono text-ink-secondary">{email}</span>
        </p>
        <button
          type="button"
          onClick={() => { setSent(false); setEmail('') }}
          className="mt-6 font-inter text-sm text-ink-tertiary underline-offset-2 hover:underline"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="font-mono text-xs font-medium uppercase tracking-wider text-ink-secondary"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-10 w-full rounded-lg border border-[0.5px] border-[var(--color-border)] bg-surface px-3 font-inter text-sm text-ink-primary placeholder:text-ink-tertiary focus:border-ink-secondary focus:outline-none"
          placeholder="you@neweraventures.com"
        />
      </div>

      {error && (
        <p className="font-inter text-xs text-accent-negative" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 h-10 w-full rounded-lg bg-ink-primary font-inter text-sm font-medium text-canvas transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Sending…' : 'Send sign-in link'}
      </button>

      <p className="text-center font-inter text-xs text-ink-tertiary">
        Access by invitation only.
      </p>
    </form>
  )
}
