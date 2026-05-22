import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NavDesktop } from '@/components/ui/NavDesktop'
import { NavMobile } from '@/components/ui/NavMobile'

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0][0].toUpperCase()
  }
  return (email?.[0] ?? '?').toUpperCase()
}

export default async function LPLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()
  const profile = profileData as { full_name: string | null; email: string | null } | null

  const initials = getInitials(profile?.full_name, profile?.email ?? user.email)

  return (
    <div className="flex flex-col min-h-screen">
      <NavDesktop initials={initials} />
      <NavMobile initials={initials} />
      <main className="flex-1">{children}</main>
      <footer className="bg-surface border-t border-border-hairline mt-20">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-16">
            <div>
              <p className="font-inter text-caption uppercase tracking-[0.08em] text-white/40 mb-3">
                Reporting basis
              </p>
              <p className="font-inter text-[13px] leading-relaxed text-white/60">
                Carrying values reflect the last priced round, 409A valuation, or marked-up SAFE
                conversion price where applicable. Figures are unaudited and prepared by the General
                Partner for informational purposes only.
              </p>
            </div>
            <div>
              <p className="font-inter text-caption uppercase tracking-[0.08em] text-white/40 mb-3">
                Confidential
              </p>
              <p className="font-inter text-[13px] leading-relaxed text-white/60">
                For LP and fund administration use only. Do not distribute.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
