'use client'

import { useState, useTransition } from 'react'
import { deactivateUser } from './actions'

export function DeactivateButton({ userId }: { userId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()

  if (confirming) {
    return (
      <span className="flex items-center gap-2">
        <button
          onClick={() =>
            startTransition(async () => {
              await deactivateUser(userId)
              setConfirming(false)
            })
          }
          disabled={pending}
          className="font-mono text-xs text-accent-negative underline-offset-2 hover:underline disabled:opacity-50"
        >
          {pending ? 'Deactivating…' : 'Confirm'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="font-mono text-xs text-ink-tertiary underline-offset-2 hover:underline disabled:opacity-50"
        >
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="font-mono text-xs text-ink-tertiary underline-offset-2 hover:text-accent-negative hover:underline"
    >
      Deactivate
    </button>
  )
}
