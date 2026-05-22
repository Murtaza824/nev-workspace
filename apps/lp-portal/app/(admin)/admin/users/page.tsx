import { createAdminClient } from '@/lib/supabase/server'
import { formatUSD, formatDate } from '@/lib/format'
import { InviteLPForm } from '@/components/admin/InviteLPForm'
import { CommitmentEditCell } from '@/components/admin/CommitmentEditCell'
import { EntityAssignCell } from '@/components/admin/EntityAssignCell'
import { UserActionsCell } from '@/components/admin/UserActionsCell'
import type { Profile, LpEntity } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

type ProfileWithEntity = Profile & { lp_entities: LpEntity | null }

type UserRow = {
  profile: ProfileWithEntity
  authUser: User | null
}

export default async function AdminUsersPage() {
  const adminSupabase = createAdminClient()

  const [profilesResult, authUsersResult, entitiesResult] = await Promise.all([
    adminSupabase.from('profiles').select('*, lp_entities(*)').order('created_at', { ascending: false }),
    adminSupabase.auth.admin.listUsers({ perPage: 1000 }),
    adminSupabase.from('lp_entities').select('*').order('name'),
  ])

  const profiles = (profilesResult.data ?? []) as unknown as ProfileWithEntity[]
  const authUsers: User[] = authUsersResult.data?.users ?? []
  const allEntities = (entitiesResult.data ?? []) as LpEntity[]

  // Build a map from user id → auth.users row
  const authUserMap: Record<string, User> = {}
  for (const u of authUsers) {
    authUserMap[u.id] = u
  }

  const rows: UserRow[] = profiles.map((profile) => ({
    profile,
    authUser: authUserMap[profile.id] ?? null,
  }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 animate-fade-up">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-fraunces text-display-2-mobile md:text-display-2 text-ink-primary mb-1">
            Users
          </h1>
          <p className="font-inter text-body text-ink-secondary">
            {rows.length} {rows.length === 1 ? 'user' : 'users'} · limited partners and admins
          </p>
        </div>
      </div>

      {/* Invite form */}
      <div className="mb-8">
        <InviteLPForm />
      </div>

      {/* Users table — desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border-hairline">
              <th className="py-3 pr-6 text-left font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
                Name
              </th>
              <th className="py-3 pr-6 text-left font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
                Email
              </th>
              <th className="py-3 pr-6 text-left font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
                Entity
              </th>
              <th className="py-3 pr-6 text-right font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
                Commitment
              </th>
              <th className="py-3 pr-6 text-left font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
                Joined
              </th>
              <th className="py-3 pr-6 text-left font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
                Status
              </th>
              <th className="py-3 text-left font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ profile, authUser }) => {
              const isActive = authUser?.last_sign_in_at != null
              const joinedAt = authUser?.created_at ?? profile.created_at
              return (
                <tr key={profile.id} className="border-b border-border-hairline">
                  <td className="py-4 pr-6 font-inter text-body text-ink-primary">
                    {profile.full_name || '—'}
                    {profile.role === 'admin' && (
                      <span className="ml-2 inline-flex items-center rounded-pill bg-pill-peach-bg px-2 py-0.5 font-inter text-caption text-pill-peach-ink">
                        admin
                      </span>
                    )}
                  </td>
                  <td className="py-4 pr-6 font-inter text-body text-ink-secondary">
                    {profile.email || '—'}
                  </td>
                  <td className="py-4 pr-6">
                    {profile.role === 'lp' ? (
                      <EntityAssignCell
                        userId={profile.id}
                        lpName={profile.full_name}
                        currentEntity={profile.lp_entities}
                        allEntities={allEntities}
                      />
                    ) : (
                      <span className="font-inter text-body text-ink-tertiary">—</span>
                    )}
                  </td>
                  <td className="py-4 pr-6 text-right">
                    {profile.role === 'lp' ? (
                      <CommitmentEditCell
                        userId={profile.id}
                        currentAmount={profile.commitment_amount}
                      />
                    ) : (
                      <span className="font-inter text-body text-ink-tertiary">—</span>
                    )}
                  </td>
                  <td className="py-4 pr-6 font-mono text-mono-sm text-ink-secondary">
                    {joinedAt ? formatDate(joinedAt) : '—'}
                  </td>
                  <td className="py-4 pr-6">
                    {isActive ? (
                      <span className="inline-flex items-center rounded-pill bg-pill-mint-bg px-2.5 py-1 font-inter text-caption text-pill-mint-ink">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-pill bg-pill-slate-bg px-2.5 py-1 font-inter text-caption text-pill-slate-ink">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-4">
                    {profile.role === 'lp' ? (
                      <UserActionsCell
                        userId={profile.id}
                        email={profile.email ?? ''}
                        isPending={!isActive}
                      />
                    ) : (
                      <span className="font-inter text-caption text-ink-tertiary">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center font-inter text-body text-ink-secondary">
                  No users yet. Invite an LP above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Users list — mobile */}
      <div className="block md:hidden">
        <ul className="flex flex-col gap-3">
          {rows.map(({ profile, authUser }) => {
            const isActive = authUser?.last_sign_in_at != null
            const joinedAt = authUser?.created_at ?? profile.created_at
            return (
              <li
                key={profile.id}
                className="rounded-card border border-border-hairline bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-inter text-body text-ink-primary">
                      {profile.full_name || '—'}
                    </p>
                    <p className="font-inter text-caption text-ink-secondary mt-0.5">
                      {profile.email || '—'}
                    </p>
                  </div>
                  {isActive ? (
                    <span className="inline-flex items-center rounded-pill bg-pill-mint-bg px-2.5 py-1 font-inter text-caption text-pill-mint-ink shrink-0">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-pill bg-pill-slate-bg px-2.5 py-1 font-inter text-caption text-pill-slate-ink shrink-0">
                      Pending
                    </span>
                  )}
                </div>
                {profile.role === 'lp' && profile.lp_entities && (
                  <p className="font-inter text-caption text-ink-secondary mt-1 mb-2">
                    {profile.lp_entities.name}
                  </p>
                )}
                <div className="flex items-center justify-between">
                </div>
                {profile.role === 'lp' && (
                  <div className="mt-2">
                    <UserActionsCell
                      userId={profile.id}
                      email={profile.email ?? ''}
                      isPending={!isActive}
                    />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  {profile.role === 'lp' ? (
                    <CommitmentEditCell
                      userId={profile.id}
                      currentAmount={profile.commitment_amount}
                    />
                  ) : (
                    <span className="font-inter text-caption text-ink-tertiary">Admin</span>
                  )}
                  <span className="font-mono text-mono-sm text-ink-tertiary">
                    {joinedAt ? formatDate(joinedAt) : '—'}
                  </span>
                </div>
              </li>
            )
          })}
          {rows.length === 0 && (
            <li className="py-12 text-center font-inter text-body text-ink-secondary">
              No users yet. Invite an LP above.
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
