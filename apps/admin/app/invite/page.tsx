import Link from 'next/link'
import { createServerClient } from '@nev/db'
import { InviteForm } from './InviteForm'

export const metadata = { title: 'Invite user — NEV Admin' }

export default async function InvitePage() {
  const supabase = await createServerClient()
  const { data: tools } = await supabase
    .from('tools')
    .select('id, name')
    .eq('active', true)
    .order('id')

  return (
    <main className="min-h-screen bg-canvas px-6 py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <Link
            href="/"
            className="font-mono text-xs text-ink-tertiary hover:text-ink-secondary"
          >
            ← users
          </Link>
          <span className="font-mono text-xs text-ink-tertiary">/</span>
          <span className="font-mono text-xs text-ink-secondary">invite</span>
        </div>

        <h1 className="mb-6 font-inter text-base font-medium text-ink-primary">
          Invite a user
        </h1>

        <InviteForm tools={tools ?? []} />
      </div>
    </main>
  )
}
