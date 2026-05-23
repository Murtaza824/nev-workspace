'use client'

import { useRef, useTransition } from 'react'
import { addNote } from './actions'

export function NoteForm({ signalId }: { signalId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const body = (new FormData(e.currentTarget).get('body') as string).trim()
    if (!body) return
    startTransition(async () => {
      await addNote(signalId, body)
      formRef.current?.reset()
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mt-[10px]">
      <textarea
        name="body"
        rows={3}
        placeholder="Add a note..."
        required
        className="w-full text-[13px] leading-[1.5] resize-none rounded-[8px] px-[12px] py-[10px]"
        style={{
          background: 'var(--color-background-secondary)',
          color: 'var(--color-text-primary)',
          border: '0.5px solid var(--color-border-secondary)',
          outline: 'none',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-border-primary)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border-secondary)' }}
      />
      <div className="flex justify-end mt-[6px]">
        <button
          type="submit"
          disabled={isPending}
          className="text-[12px] px-[11px] py-[4px] rounded-full cursor-pointer disabled:opacity-50"
          style={{ background: 'var(--color-text-primary)', color: 'var(--color-background-primary)' }}
        >
          {isPending ? 'Saving...' : 'Add note'}
        </button>
      </div>
    </form>
  )
}
