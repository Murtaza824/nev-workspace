import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const PARENT_DOMAIN =
  process.env.NODE_ENV === 'production'
    ? `.${process.env.NEV_PARENT_DOMAIN ?? 'neweraventures.com'}`
    : undefined

const APP_URLS: Record<string, string> = {
  sourcing: 'https://sourcing.neweraventures.com',
  admin:    'https://admin.neweraventures.com',
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
  const next = searchParams.get('next') ?? ''

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

  // Use the service role key to reliably run invitation acceptance and
  // fetch the profile — this bypasses RLS and any client-side timing issues.
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  // Accept any pending invitation server-side. If already accepted by the
  // client callback this is a no-op (the RPC only acts on accepted_at IS NULL).
  await adminClient.rpc('accept_invitation', {
    p_user_id: data.session.user.id,
    p_user_email: data.session.user.email ?? '',
  })

  const { data: profileData } = await adminClient
    .from('profiles')
    .select('app_access, status')
    .eq('id', data.session.user.id)
    .single()

  // Fallback: if still 'invited' (e.g. the invite was already consumed by
  // the client but the profile update didn't commit), activate directly.
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
