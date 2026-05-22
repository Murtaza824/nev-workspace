'use client'

import { useState, useTransition } from 'react'
import { deleteLP, resendInvite } from '@/app/(admin)/admin/users/actions'

interface UserActionsCellProps {
  userId: string
  email: string
  isPending: boolean
}

export function UserActionsCell({ userId, email, isPending }: UserActionsCellProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [resendDone, setResendDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeletingPending, startDelete] = useTransition()
  const [isResendingPending, startResend] = useTransition()

  function handleDelete() {
    setError(null)
    const data = new FormData()
    data.set('user_id', userId)
    startDelete(async () => {
      const result = await deleteLP(data)
      if ('error' in result && result.error) {
        setError(result.error)
        setConfirmDelete(false)
      }
    })
  }

  function handleResend() {
    setError(null)
    const data = new FormData()
    data.set('email', email)
    startResend(async () => {
      const result = await resendInvite(data)
      if ('error' in result && result.error) {
        setError(result.error)
      } else {
        setResendDone(true)
        setTimeout(() => setResendDone(false), 3000)
      }
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3 flex-wrap">
        {isPending && (
          resendDone ? (
            <span className="font-inter text-caption text-accent-positive">Sent</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResendingPending}
              className="font-inter text-caption text-ink-secondary hover:text-ink-primary transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isResendingPending ? 'Sending…' : 'Resend invite'}
            </button>
          )
        )}

        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="font-inter text-caption text-ink-secondary hover:text-accent-negative transition-colors"
          >
            Delete
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-inter text-caption text-ink-secondary">Sure?</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeletingPending}
              className="font-inter text-caption text-accent-negative hover:opacity-75 transition-opacity disabled:opacity-50"
            >
              {isDeletingPending ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="font-inter text-caption text-ink-secondary hover:text-ink-primary transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="font-inter text-caption text-accent-negative">{error}</p>
      )}
    </div>
  )
}
