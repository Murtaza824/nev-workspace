'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const COOKIE_OPTIONS =
  process.env.NODE_ENV === 'production'
    ? { domain: '.neweraventures.com', sameSite: 'lax' as const, secure: true }
    : undefined

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
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          COOKIE_OPTIONS ? { cookieOptions: COOKIE_OPTIONS } : {},
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

        const redirectTarget = next.startsWith('http') ? next : 'https://lp.neweraventures.com'
        setStatus(`Redirecting to ${redirectTarget}`)
        window.location.replace(redirectTarget)
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
