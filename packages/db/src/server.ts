import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

function resolveCookieDomain(): string | undefined {
  if (process.env.NODE_ENV !== 'production') return undefined
  return `.${process.env.NEV_PARENT_DOMAIN ?? 'neweraventures.com'}`
}

export async function createServerClient() {
  const cookieStore = await cookies()
  const domain = resolveCookieDomain()

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                ...(domain ? { domain } : {}),
                sameSite: 'lax' as const,
                secure: process.env.NODE_ENV === 'production',
              })
            )
          } catch {
            // Called from a Server Component — middleware handles session refresh
          }
        },
      },
    }
  )
}
