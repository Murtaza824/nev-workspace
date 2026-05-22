'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addCoInvestor, removeCoInvestor } from '@/app/(admin)/admin/portfolio/actions'
import type { CoInvestor } from '@/lib/types'

interface Props {
  companyId: string
  slug: string
  initialCoInvestors: CoInvestor[]
}

export function CoInvestorManager({ companyId, slug, initialCoInvestors }: Props) {
  const router = useRouter()
  const [coInvestors, setCoInvestors] = useState(initialCoInvestors)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!newName.trim()) return
    setError(null)
    const data = new FormData()
    data.set('name', newName.trim())
    data.set('slug', slug)
    startTransition(async () => {
      const result = await addCoInvestor(companyId, data)
      if ('error' in result && result.error) {
        setError(result.error)
      } else {
        setNewName('')
        router.refresh()
      }
    })
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      const result = await removeCoInvestor(id, slug)
      if ('error' in result && result.error) {
        setError(result.error)
      } else {
        setCoInvestors((prev) => prev.filter((ci) => ci.id !== id))
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Existing co-investors */}
      {coInvestors.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {coInvestors.map((ci) => (
            <li key={ci.id} className="flex items-center justify-between rounded-input border border-border-hairline bg-surface-warm px-3 py-2">
              <span className="font-inter text-body text-ink-primary">{ci.name}</span>
              <button
                type="button"
                onClick={() => handleRemove(ci.id)}
                disabled={isPending}
                className="font-inter text-caption text-ink-secondary hover:text-accent-negative transition-colors duration-200 disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-inter text-body text-ink-tertiary">No co-investors yet.</p>
      )}

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Co-investor name"
          className="flex-1 rounded-input border border-border-hairline bg-surface-warm px-3 py-2 font-inter text-body text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-white/30"
        />
        <button
          type="submit"
          disabled={isPending || !newName.trim()}
          className="rounded-pill bg-surface-warm border border-border-hairline px-3 py-2 font-inter text-body text-ink-primary hover:border-white/20 transition-colors duration-200 disabled:opacity-50 shrink-0"
        >
          Add
        </button>
      </form>

      {error && <p className="font-inter text-caption text-accent-negative">{error}</p>}
    </div>
  )
}
