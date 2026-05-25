'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

function CallbackHandler({ setStatus }: { setStatus: (s: string) => void }) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? ''

    if (!code) {
      window.location.replace('/login?error=missing_code')
      return
    }

    setStatus('Exchanging…')

    // createBrowserClient hardcodes detectSessionInUrl: isBrowser() after spreading
    // options.auth, so it cannot be overridden. On any page whose URL contains ?code=,
    // the client auto-calls exchangeCodeForSession during _initialize(), reads the PKCE
    // verifier, and removes it in the finally block — before any manual call could run.
    //
    // Fix: don't call exchangeCodeForSession manually. Subscribe to onAuthStateChange
    // and react to INITIAL_SESSION, which fires once _initialize() completes (success
    // or failure). The auto-exchange IS the exchange; we just observe the result.
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

        setStatus('Finalising…')
        await supabase.rpc('accept_invitation', {
          p_user_id: session.user.id,
          p_user_email: session.user.email!,
        })

        const finaliseUrl = `/api/finalise-auth${next ? `?next=${encodeURIComponent(next)}` : ''}`
        setStatus('Setting session…')
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
