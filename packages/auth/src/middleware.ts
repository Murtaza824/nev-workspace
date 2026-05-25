import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_URL = process.env.NEV_AUTH_URL ?? 'https://auth.neweraventures.com'
const PARENT_DOMAIN = process.env.NEV_PARENT_DOMAIN ?? 'neweraventures.com'

function cookieDomain(): string | undefined {
  return process.env.NODE_ENV === 'production' ? `.${PARENT_DOMAIN}` : undefined
}

function buildClient(request: NextRequest, responseRef: { current: NextResponse }) {
  const domain = cookieDomain()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          responseRef.current = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            responseRef.current.cookies.set(name, value, {
              ...options,
              ...(domain ? { domain } : {}),
              sameSite: 'lax' as const,
              secure: process.env.NODE_ENV === 'production',
            })
          )
        },
      },
    }
  )
}

/**
 * Middleware for tool-specific apps. Checks:
 *   1. User is authenticated (redirects to auth app login if not)
 *   2. Profile status is 'active' AND app_access includes toolId (redirects to no-access if not)
 *
 * Usage in apps/<tool>/middleware.ts:
 *   export const middleware = createAccessMiddleware('sourcing')
 *   export const config = { matcher: [...] }
 */
export function createAccessMiddleware(toolId: string) {
  return async function middleware(request: NextRequest) {
    const responseRef = { current: NextResponse.next({ request }) }
    const supabase = buildClient(request, responseRef)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const next = encodeURIComponent(request.url)
      return NextResponse.redirect(`${AUTH_URL}/login?next=${next}`)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('app_access, status, last_seen_at')
      .eq('id', user.id)
      .single()

    if (!profile || profile.status !== 'active' || !(profile.app_access as string[]).includes(toolId)) {
      return NextResponse.redirect(`${AUTH_URL}/no-access`)
    }

    const lastSeen = (profile as unknown as { last_seen_at: string | null }).last_seen_at
    if (!lastSeen || new Date(lastSeen).getTime() < Date.now() - 60 * 60 * 1000) {
      await supabase.rpc('touch_last_seen')
    }

    return responseRef.current
  }
}

/**
 * Middleware for the admin app. Checks:
 *   1. User is authenticated
 *   2. Profile role is 'admin' AND status is 'active'
 */
export function createAdminMiddleware() {
  return async function middleware(request: NextRequest) {
    const responseRef = { current: NextResponse.next({ request }) }
    const supabase = buildClient(request, responseRef)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const next = encodeURIComponent(request.url)
      return NextResponse.redirect(`${AUTH_URL}/login?next=${next}`)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status, last_seen_at')
      .eq('id', user.id)
      .single()

    if (!profile || profile.status !== 'active' || profile.role !== 'admin') {
      return NextResponse.redirect(`${AUTH_URL}/no-access`)
    }

    const lastSeen = (profile as unknown as { last_seen_at: string | null }).last_seen_at
    if (!lastSeen || new Date(lastSeen).getTime() < Date.now() - 60 * 60 * 1000) {
      await supabase.rpc('touch_last_seen')
    }

    return responseRef.current
  }
}

/** Standard matcher config — paste into each app's middleware.ts */
export const standardMatcher = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
