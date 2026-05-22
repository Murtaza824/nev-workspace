import Link from 'next/link'
import { createAdminClient, createServerClient } from '@nev/db'
import type { Database } from '@nev/db'

type ProfileRow = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'id' | 'role' | 'app_access' | 'status' | 'last_seen_at'
>

const STATUS_LABEL: Record<string, string> = {
  active: 'ACTIVE',
  invited: 'INVITED',
  deactivated: 'DEACTIVATED',
}

const TOOL_LABEL: Record<string, string> = {
  lp_portal: 'LP Portal',
  sourcing: 'Signal',
  admin: 'Admin',
}

function formatLastSeen(ts: string | null): string {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function UsersPage() {
  const supabase = await createServerClient()
  const adminClient = createAdminClient()

  const [profilesResult, usersResult] = await Promise.all([
    supabase.from('profiles').select('id, role, app_access, status, last_seen_at').order('role'),
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
  ])

  // supabase-js 2.106.1 + TS 5.9.x fails to thread Schema through PostgrestQueryBuilder generics;
  // explicit cast is safe — the query selects exactly these columns.
  const profiles: ProfileRow[] = (profilesResult.data as ProfileRow[] | null) ?? []
  const authUsers = usersResult.data?.users ?? []

  const emailById = Object.fromEntries(authUsers.map((u) => [u.id, u.email ?? '']))

  const rows = profiles.map((p) => ({
    ...p,
    email: emailById[p.id] ?? '—',
  }))

  return (
    <main className="min-h-screen bg-canvas">
      <header className="flex items-center justify-between border-b border-[0.5px] border-[var(--color-border)] px-6 py-4">
        <span className="font-mono text-xs font-medium uppercase tracking-widest text-ink-tertiary">
          NEV ADMIN
        </span>
        <Link
          href="/invite"
          className="rounded-lg bg-ink-primary px-4 py-2 font-inter text-xs font-medium text-canvas transition-opacity hover:opacity-90"
        >
          Invite user
        </Link>
      </header>

      <div className="px-6 py-8">
        <div className="mb-4 flex items-baseline gap-2">
          <h1 className="font-inter text-sm font-medium text-ink-primary">Users</h1>
          <span className="font-mono text-xs text-ink-tertiary">{rows.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[0.5px] border-[var(--color-border)]">
                {['Email', 'Role', 'Access', 'Status', 'Last seen'].map((h) => (
                  <th
                    key={h}
                    className="py-2 pr-6 text-left font-mono text-xs font-medium uppercase tracking-wider text-ink-tertiary"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[0.5px] border-[var(--color-border)] last:border-0"
                >
                  <td className="py-3 pr-6 font-inter text-sm text-ink-primary">
                    {row.email}
                  </td>
                  <td className="py-3 pr-6 font-mono text-xs text-ink-secondary">
                    {row.role}
                  </td>
                  <td className="py-3 pr-6">
                    <div className="flex flex-wrap gap-1.5">
                      {(row.app_access as string[]).map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-surface px-2.5 py-0.5 font-mono text-xs text-ink-secondary"
                        >
                          {TOOL_LABEL[t] ?? t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 pr-6">
                    <span
                      className={[
                        'font-mono text-xs',
                        row.status === 'active' ? 'text-accent-positive' : 'text-ink-tertiary',
                      ].join(' ')}
                    >
                      {STATUS_LABEL[row.status as string] ?? row.status}
                    </span>
                  </td>
                  <td className="py-3 pr-6 font-mono text-xs text-ink-tertiary">
                    {formatLastSeen(row.last_seen_at as string | null)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center font-mono text-xs text-ink-tertiary">
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
