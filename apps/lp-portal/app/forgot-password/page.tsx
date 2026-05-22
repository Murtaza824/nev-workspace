'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lp.neweraventures.com'

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${siteUrl}/auth/callback`,
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-5 py-12 md:px-0">
      <div className="animate-fade-up w-full max-w-sm">
        <div className="flex justify-center">
          <Logo className="h-8 w-auto text-ink-primary" />
        </div>

        <p className="mt-4 text-center font-inter text-body text-ink-secondary">
          Reset your password
        </p>

        {sent ? (
          <div className="mt-8 rounded-card border border-border-hairline bg-surface p-6 text-center">
            <p className="font-inter text-body text-ink-primary mb-1">Check your email</p>
            <p className="font-inter text-caption text-ink-secondary">
              We sent a password reset link to <span className="text-ink-primary">{email}</span>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary"
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
                className="h-12 w-full rounded-input border border-border-hairline bg-surface px-3 font-inter text-body text-ink-primary placeholder:text-ink-tertiary focus:border-ink-secondary focus:outline-none focus:ring-0 md:h-10"
                placeholder="you@example.com"
              />
            </div>

            {error && (
              <p className="font-inter text-caption text-accent-negative" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-[52px] w-full rounded-input bg-ink-primary font-inter text-body font-medium text-canvas transition-opacity duration-200 ease-out hover:opacity-90 disabled:opacity-50 md:h-10"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center font-inter text-caption text-ink-tertiary">
          <Link href="/login" className="hover:text-ink-secondary transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
