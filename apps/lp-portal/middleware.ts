import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://auth.neweraventures.com'
    : 'http://localhost:3001'

const PARENT_DOMAIN =
  process.env.NODE_ENV === 'production'
    ? `.${process.env.NEV_PARENT_DOMAIN ?? 'neweraventures.com'}`
    : undefined

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              ...(PARENT_DOMAIN ? { domain: PARENT_DOMAIN } : {}),
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            }),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const next = encodeURIComponent(request.url)
    return NextResponse.redirect(`${AUTH_URL}/login?next=${next}`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('app_access, status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status !== 'active' || !(profile.app_access as string[]).includes('lp_portal')) {
    return NextResponse.redirect(`${AUTH_URL}/no-access`)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
