import type { Metadata } from 'next'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatUSD } from '@/lib/format'
import { ChangePasswordForm } from '@/components/lp/ChangePasswordForm'
import { InviteTeamMemberForm } from '@/components/lp/InviteTeamMemberForm'
import { TeamMemberList } from '@/components/lp/TeamMemberList'
import { signOut } from './actions'
import type { Profile, LpEntity } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Account',
  robots: { index: false, follow: false },
}

type ProfileWithEntity = Profile & {
  lp_entities: LpEntity | null
}

export default async function AccountPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('*, lp_entities(*)')
    .eq('id', user.id)
    .single()

  const profile = rawProfile as ProfileWithEntity | null
  const entity: LpEntity | null = profile?.lp_entities ?? null

  const effectiveCommitment =
    entity?.commitment_amount ?? profile?.commitment_amount ?? 0
  const displayName =
    entity?.name ?? profile?.full_name ?? 'Your account'
  const email = profile?.email ?? user.email ?? ''

  // Fetch team members if LP belongs to an entity
  let teamMembers: Pick<Profile, 'id' | 'full_name' | 'email' | 'entity_role'>[] = []
  if (profile?.entity_id) {
    const adminSupabase = createAdminClient()
    const { data } = await adminSupabase
      .from('profiles')
      .select('id, full_name, email, entity_role')
      .eq('entity_id', profile.entity_id)
      .neq('id', user.id)
      .order('created_at', { ascending: true })
    teamMembers = (data ?? []) as Pick<Profile, 'id' | 'full_name' | 'email' | 'entity_role'>[]
  }

  return (
    <div className="mx-auto max-w-[640px] px-4 py-10 md:px-8 animate-fade-up">
      {/* Profile card */}
      <div className="rounded-card border border-border-hairline bg-surface p-6 mb-6">
        <h1 className="font-fraunces text-heading-mobile md:text-heading text-ink-primary mb-5">
          Your account
        </h1>

        <div className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <p className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary mb-0.5">
              Name
            </p>
            <p className="font-inter font-medium text-body text-ink-primary">
              {displayName}
            </p>
          </div>

          {/* Entity (if applicable and distinct from personal name) */}
          {entity?.name && profile?.full_name && entity.name !== profile.full_name && (
            <div>
              <p className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary mb-0.5">
                LP entity
              </p>
              <p className="font-inter text-body text-ink-primary">{entity.name}</p>
            </div>
          )}

          {/* Email */}
          <div>
            <p className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary mb-0.5">
              Email
            </p>
            <p className="font-inter text-body text-ink-secondary">{email}</p>
            <p className="font-inter text-caption text-ink-tertiary mt-1">
              To update your email, contact{' '}
              <a href="mailto:murtaza@neweraventures.com" className="hover:text-ink-secondary transition-colors">murtaza</a>
              {' or '}
              <a href="mailto:carter@neweraventures.com" className="hover:text-ink-secondary transition-colors">carter</a>
              {' @neweraventures.com'}
            </p>
          </div>

          {/* Commitment */}
          <div>
            <p className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary mb-0.5">
              Your commitment
            </p>
            <p className="font-mono text-mono-md text-ink-primary">
              {effectiveCommitment > 0 ? formatUSD(effectiveCommitment) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Team access card */}
      <div className="rounded-card border border-border-hairline bg-surface p-6 mb-6">
        <h2 className="font-fraunces text-heading-mobile md:text-heading text-ink-primary mb-1">
          Team access
        </h2>
        <p className="font-inter text-caption text-ink-secondary mb-5">
          Invite colleagues to view this portal under your account.
        </p>

        <TeamMemberList members={teamMembers} />
        <InviteTeamMemberForm />
      </div>

      {/* Security card */}
      <div className="rounded-card border border-border-hairline bg-surface p-6 mb-6">
        <h2 className="font-fraunces text-heading-mobile md:text-heading text-ink-primary mb-5">
          Security
        </h2>
        <ChangePasswordForm />
      </div>

      {/* Sign out */}
      <form action={signOut}>
        <button
          type="submit"
          className="w-full rounded-input border border-border-hairline bg-surface px-4 py-3 font-inter text-body text-ink-secondary hover:text-ink-primary hover:border-white/20 transition-colors duration-200"
        >
          Sign out
        </button>
      </form>
    </div>
  )
}
