'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

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

        setStatus('Exchanging code…')
        // No custom cookieOptions here — the domain option interferes with the
        // PKCE verifier lookup. A server hop below re-writes with parent domain.
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

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

        // Hand off to a server route that re-writes session cookies with the
        // parent domain so all *.neweraventures.com apps share the session.
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
