'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

function CallbackHandler({ setStatus }: { setStatus: (s: string) => void }) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const next = searchParams.get('next') ?? ''

    // createBrowserClient._initialize() handles both PKCE (?code= query param) and
    // implicit flow (hash fragment #access_token=) automatically. Do not check for
    // ?code= here — invite links may use hash fragments and would be incorrectly
    // bounced to login before the session could be established.
    //
    // Subscribe to INITIAL_SESSION which fires once _initialize() completes,
    // regardless of which flow was used. session will be null on failure.
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const timeout = setTimeout(() => {
      window.location.replace('/login?error=auth_failed&msg=timeout')
    }, 15000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event !== 'INITIAL_SESSION') return

        clearTimeout(timeout)
        subscription.unsubscribe()

        if (!session) {
          setStatus('Error: no session')
          window.location.replace('/login?error=auth_failed&msg=no_session')
          return
        }

        const finaliseUrl = `/api/finalise-auth${next ? `?next=${encodeURIComponent(next)}` : ''}`
        window.location.replace(finaliseUrl)
      },
    )

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
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
