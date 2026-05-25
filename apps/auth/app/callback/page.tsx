'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

function clearStaleAuthCookies() {
  // Stale session cookies from previous failed attempts cause the Supabase
  // client to try refreshing a broken session on init, which deadlocks before
  // exchangeCodeForSession can run. Clear them but preserve the PKCE verifier.
  document.cookie.split('; ').forEach(raw => {
    const name = raw.split('=')[0].trim()
    if (name.startsWith('sb-') && !name.endsWith('-code-verifier')) {
      const base = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
      document.cookie = base
      document.cookie = `${base}; domain=.neweraventures.com`
    }
  })
}

function CallbackHandler({ setStatus }: { setStatus: (s: string) => void }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? ''

    async function handle() {
      try {
        if (!code) {
          setStatus('Error: missing code')
          window.location.replace('/login?error=missing_code')
          return
        }

        setStatus('Preparing…')
        clearStaleAuthCookies()

        setStatus('Exchanging code…')
        // isSingleton: false forces a fresh client so no stale lock or
        // initializePromise from the login page can block this exchange.
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { isSingleton: false },
        )

        const result = await Promise.race([
          supabase.auth.exchangeCodeForSession(code),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('exchange_timed_out_15s')), 15000),
          ),
        ])

        const { data, error } = result

        if (error || !data.user) {
          const msg = error?.message ?? 'no_user'
          setStatus(`Error: ${msg}`)
          window.location.replace(`/login?error=auth_failed&msg=${encodeURIComponent(msg)}`)
          return
        }

        setStatus('Finalising…')
        await supabase.rpc('accept_invitation', {
          p_user_id: data.user.id,
          p_user_email: data.user.email!,
        })

        const finaliseUrl = `/api/finalise-auth${next ? `?next=${encodeURIComponent(next)}` : ''}`
        setStatus('Setting session…')
        window.location.replace(finaliseUrl)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        setStatus(`Exception: ${msg}`)
      }
    }

    handle()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export default function CallbackPage() {
  const [status, setStatus] = useState('Starting…')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2">
      <p className="font-inter text-sm" style={{ color: '#888' }}>
        Signing you in…
      </p>
      <p className="font-mono text-xs" style={{ color: '#aaa' }}>
        {status}
      </p>
      <Suspense>
        <CallbackHandler setStatus={setStatus} />
      </Suspense>
    </div>
  )
}
