'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { EmailOtpType } from '@supabase/supabase-js'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = createClient()
    const next = searchParams.get('next') ?? '/dashboard'
    const code = searchParams.get('code')
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null

    async function handle() {
      // ── 1. PKCE code exchange (magic links) ──────────────────────────────
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          router.replace(next)
          return
        }
      }

      // ── 2. Token hash flow ────────────────────────────────────────────────
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
        if (!error) {
          const needsPasswordSet = type === 'invite' || type === 'recovery'
          router.replace(needsPasswordSet ? '/auth/set-password' : next)
          return
        }
      }

      // ── 3. Hash fragment flow (#access_token=…) ───────────────────────────
      // @supabase/ssr's createBrowserClient does NOT auto-process hash
      // fragments, so we parse and call setSession manually.
      const rawHash = window.location.hash.slice(1)
      if (rawHash) {
        const params = new URLSearchParams(rawHash)
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const hashType = params.get('type')

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (!error) {
            const needsPasswordSet = hashType === 'invite' || hashType === 'recovery'
            router.replace(needsPasswordSet ? '/auth/set-password' : next)
            return
          }
        }
      }

      // ── 4. Already signed in (edge case) ─────────────────────────────────
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace(next)
        return
      }

      router.replace('/login?error=auth')
    }

    handle()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <p className="font-inter text-body text-ink-secondary animate-pulse">
        Signing you in…
      </p>
      <Suspense>
        <CallbackHandler />
      </Suspense>
    </div>
  )
}
