'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

// Write session cookies to the parent domain so they reach every *.neweraventures.com app.
const COOKIE_OPTIONS =
  process.env.NODE_ENV === 'production'
    ? { domain: '.neweraventures.com', sameSite: 'lax' as const, secure: true }
    : undefined

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? ''

    async function handle() {
      if (!code) {
        router.replace('/login?error=missing_code')
        return
      }

      // Exchange happens in the browser so the PKCE code verifier (stored in
      // browser cookies by signInWithOtp) is always accessible here.
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        COOKIE_OPTIONS ? { cookieOptions: COOKIE_OPTIONS } : {},
      )

      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error || !data.user) {
        const msg = encodeURIComponent(error?.message ?? 'no_user')
        router.replace(`/login?error=auth_failed&msg=${msg}`)
        return
      }

      // No-op if there is no pending invitation for this email.
      await supabase.rpc('accept_invitation', {
        p_user_id: data.user.id,
        p_user_email: data.user.email!,
      })

      const redirectTarget = next.startsWith('http') ? next : 'https://lp.neweraventures.com'
      router.replace(redirectTarget)
    }

    handle()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export default function CallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="font-inter text-sm" style={{ color: 'var(--color-ink-tertiary, #888)' }}>
        Signing you in…
      </p>
      <Suspense>
        <CallbackHandler />
      </Suspense>
    </div>
  )
}
