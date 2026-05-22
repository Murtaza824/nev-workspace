'use client'

import { useState, useTransition } from 'react'
import { updateCommitment } from '@/app/(admin)/admin/users/actions'
import { formatUSD } from '@/lib/format'

interface Props {
  userId: string
  currentAmount: number | null
}

export function CommitmentEditCell({ userId, currentAmount }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(currentAmount?.toString() ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData()
    data.set('user_id', userId)
    data.set('commitment_amount', value)
    startTransition(async () => {
      await updateCommitment(data)
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-28 rounded-input border border-border-hairline bg-surface-warm px-2 py-1 font-mono text-mono-sm text-ink-primary focus:outline-none focus:border-white/30"
          autoFocus
        />
        <button
          type="submit"
          disabled={isPending}
          className="font-inter text-caption text-accent-positive hover:opacity-80 disabled:opacity-50"
        >
          {isPending ? '…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="font-inter text-caption text-ink-secondary hover:text-ink-primary"
        >
          Cancel
        </button>
      </form>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="font-mono text-mono-sm text-ink-primary hover:text-accent-positive transition-colors duration-200 text-left"
      title="Click to edit commitment"
    >
      {currentAmount != null ? formatUSD(currentAmount) : '—'}
    </button>
  )
}
