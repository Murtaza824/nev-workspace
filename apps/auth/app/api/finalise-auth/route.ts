import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const PARENT_DOMAIN =
  process.env.NODE_ENV === 'production'
    ? `.${process.env.NEV_PARENT_DOMAIN ?? 'neweraventures.com'}`
    : undefined

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const next = searchParams.get('next') ?? ''
  const redirectTarget = next.startsWith('http') ? next : 'https://lp.neweraventures.com'

  const pendingCookies: { name: string; value: string; options: CookieOptions }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          pendingCookies.push(...cookiesToSet)
        },
      },
    },
  )

  // refreshSession always re-issues tokens and fires setAll, giving us
  // freshly-signed cookies we can re-write with the parent domain.
  const { data, error } = await supabase.auth.refreshSession()

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/login?error=no_session`)
  }

  const response = NextResponse.redirect(redirectTarget)

  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, {
      ...options,
      ...(PARENT_DOMAIN ? { domain: PARENT_DOMAIN } : {}),
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  })

  return response
}
