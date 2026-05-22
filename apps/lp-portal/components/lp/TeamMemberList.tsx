'use client'

import { useState, useTransition } from 'react'
import { removeTeamMember, updateTeamMemberRole } from '@/app/(lp)/account/actions'

type TeamMember = {
  id: string
  full_name: string | null
  email: string | null
  entity_role: 'member' | 'admin' | null
}

export function TeamMemberList({ members }: { members: TeamMember[] }) {
  if (members.length === 0) return null

  return (
    <ul className="mb-5 flex flex-col gap-3">
      {members.map((member) => (
        <TeamMemberRow key={member.id} member={member} />
      ))}
    </ul>
  )
}

function TeamMemberRow({ member }: { member: TeamMember }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  const currentRole = member.entity_role ?? 'member'

  function handleDelete() {
    startTransition(async () => {
      await removeTeamMember(member.id)
      setConfirmDelete(false)
    })
  }

  return (
    <li className="flex items-center gap-3">
      {/* Avatar */}
      <div className="h-7 w-7 rounded-full bg-surface-warm border border-border-hairline flex items-center justify-center font-inter text-[10px] font-medium text-ink-secondary shrink-0">
        {(member.full_name?.[0] ?? member.email?.[0] ?? '?').toUpperCase()}
      </div>

      {/* Name + email */}
      <div className="flex-1 min-w-0">
        {member.full_name && (
          <p className="font-inter text-body text-ink-primary leading-tight truncate">
            {member.full_name}
          </p>
        )}
        <p className="font-inter text-caption text-ink-secondary truncate">
          {member.email}
        </p>
      </div>

      {/* Role dropdown */}
      <select
        value={currentRole}
        onChange={(e) => {
          const val = e.target.value as 'member' | 'admin'
          startTransition(async () => { await updateTeamMemberRole(member.id, val) })
        }}
        disabled={isPending}
        className="shrink-0 rounded-full border border-border-hairline bg-surface-warm px-2.5 py-0.5 font-inter text-[11px] text-ink-secondary focus:outline-none disabled:opacity-50 cursor-pointer"
      >
        <option value="member">member</option>
        <option value="admin">admin</option>
      </select>

      {/* Delete */}
      {!confirmDelete ? (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          disabled={isPending}
          className="shrink-0 font-inter text-caption text-ink-tertiary hover:text-accent-negative transition-colors duration-150 disabled:opacity-50"
        >
          Remove
        </button>
      ) : (
        <span className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="font-inter text-caption text-accent-negative disabled:opacity-50"
          >
            {isPending ? 'Removing…' : 'Yes, remove'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            disabled={isPending}
            className="font-inter text-caption text-ink-tertiary"
          >
            Cancel
          </button>
        </span>
      )}
    </li>
  )
}
