import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const PARENT_DOMAIN =
  process.env.NODE_ENV === 'production'
    ? `.${process.env.NEV_PARENT_DOMAIN ?? 'neweraventures.com'}`
    : undefined

const APP_URLS: Record<string, string> = {
  sourcing: 'https://sourcing.neweraventures.com',
  admin: 'https://admin.neweraventures.com',
  lp_portal: 'https://lp.neweraventures.com',
}

function pickLandingPage(appAccess: string[]): string {
  for (const app of ['sourcing', 'admin', 'lp_portal']) {
    if (appAccess.includes(app)) return APP_URLS[app]
  }
  return APP_URLS['lp_portal']
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? ''
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (errorParam) {
    return NextResponse.redirect(
      `${origin}/login?error=auth_failed&msg=${encodeURIComponent(errorDescription ?? errorParam)}`
    )
  }

  if (!code) {
    // No code in URL — may be an older implicit-flow link. Redirect to a
    // minimal client page that handles the hash fragment.
    return NextResponse.redirect(`${origin}/login?error=auth_failed&msg=no_code`)
  }

  const cookieStore = await cookies()
  const pendingCookies: { name: string; value: string; options: CookieOptions }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          pendingCookies.push(...cookiesToSet)
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    return NextResponse.redirect(
      `${origin}/login?error=auth_failed&msg=${encodeURIComponent(error?.message ?? 'no_session')}`
    )
  }

  // Accept any pending invitation and resolve the profile using the service role
  // so this works regardless of the profile's current RLS-visible state.
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  await adminClient.rpc('accept_invitation', {
    p_user_id: data.session.user.id,
    p_user_email: data.session.user.email ?? '',
  })

  const { data: profileData } = await adminClient
    .from('profiles')
    .select('app_access, status')
    .eq('id', data.session.user.id)
    .single()

  if (profileData?.status === 'invited') {
    await adminClient
      .from('profiles')
      .update({ status: 'active' })
      .eq('id', data.session.user.id)
  }

  let redirectTarget = next.startsWith('http') ? next : null
  if (!redirectTarget) {
    redirectTarget = pickLandingPage((profileData?.app_access as string[]) ?? [])
  }

  const response = NextResponse.redirect(redirectTarget)

  // Re-write session cookies with the parent domain so the session is shared
  // across all *.neweraventures.com subdomains.
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
