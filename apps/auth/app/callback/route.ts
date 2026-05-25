import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const PARENT_DOMAIN =
  process.env.NODE_ENV === 'production'
    ? `.${process.env.NEV_PARENT_DOMAIN ?? 'neweraventures.com'}`
    : undefined

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  // Collect cookies emitted by exchangeCodeForSession so we can attach them
  // directly to the redirect response. Using cookies() from next/headers and
  // returning NextResponse.redirect() are two separate response objects — the
  // Set-Cookie headers from the former never reach the latter.
  const pendingCookies: { name: string; value: string; options: CookieOptions }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          pendingCookies.push(...cookiesToSet)
        },
      },
    },
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    const msg = encodeURIComponent(error?.message ?? 'no_user')
    return NextResponse.redirect(`${origin}/login?error=auth_failed&msg=${msg}`)
  }

  // No-op if there is no pending invitation for this email.
  await supabase.rpc('accept_invitation', {
    p_user_id: data.user.id,
    p_user_email: data.user.email!,
  })

  const redirectTarget = next.startsWith('http') ? next : `https://lp.neweraventures.com`
  const response = NextResponse.redirect(redirectTarget)

  // Write session cookies onto the redirect response so the browser receives
  // them before it follows the Location header.
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
