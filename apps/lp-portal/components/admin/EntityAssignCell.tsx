'use client'

import { useState, useTransition } from 'react'
import { createOrAssignEntity } from '@/app/(admin)/admin/users/actions'
import type { LpEntity } from '@/lib/types'

interface EntityAssignCellProps {
  userId: string
  lpName: string | null
  currentEntity: LpEntity | null
  allEntities: LpEntity[]
}

export function EntityAssignCell({
  userId,
  lpName,
  currentEntity,
  allEntities,
}: EntityAssignCellProps) {
  const [editing, setEditing] = useState(false)
  const [mode, setMode] = useState<'assign' | 'create'>(
    allEntities.length > 0 ? 'assign' : 'create'
  )
  const [entityName, setEntityName] = useState(lpName ?? '')
  const [selectedEntityId, setSelectedEntityId] = useState(allEntities[0]?.id ?? '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const data = new FormData()
    data.set('user_id', userId)
    data.set('action', mode)
    if (mode === 'create') {
      data.set('entity_name', entityName.trim())
    } else {
      data.set('entity_id', selectedEntityId)
    }
    startTransition(async () => {
      const result = await createOrAssignEntity(data)
      if ('error' in result && result.error) {
        setError(result.error)
      } else {
        setEditing(false)
      }
    })
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-inter text-body text-ink-primary">
          {currentEntity?.name ?? '—'}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="font-inter text-caption text-ink-secondary hover:text-ink-primary transition-colors shrink-0"
        >
          {currentEntity ? 'Change' : 'Assign'}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 min-w-[200px]">
      {allEntities.length > 0 && (
        <div className="flex gap-3 font-inter text-caption">
          <button
            type="button"
            onClick={() => setMode('assign')}
            className={
              mode === 'assign'
                ? 'text-ink-primary font-medium'
                : 'text-ink-secondary hover:text-ink-primary'
            }
          >
            Existing
          </button>
          <span className="text-ink-tertiary">·</span>
          <button
            type="button"
            onClick={() => setMode('create')}
            className={
              mode === 'create'
                ? 'text-ink-primary font-medium'
                : 'text-ink-secondary hover:text-ink-primary'
            }
          >
            New entity
          </button>
        </div>
      )}

      {mode === 'assign' && allEntities.length > 0 ? (
        <select
          value={selectedEntityId}
          onChange={(e) => setSelectedEntityId(e.target.value)}
          className="rounded-input border border-border-hairline bg-surface-warm px-2 py-1.5 font-inter text-caption text-ink-primary focus:outline-none focus:border-white/30"
        >
          {allEntities.map((entity) => (
            <option key={entity.id} value={entity.id}>
              {entity.name}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={entityName}
          onChange={(e) => setEntityName(e.target.value)}
          placeholder="Entity name"
          required
          className="rounded-input border border-border-hairline bg-surface-warm px-2 py-1.5 font-inter text-caption text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-white/30"
        />
      )}

      {error && (
        <p className="font-inter text-caption text-accent-negative">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="font-inter text-caption text-ink-primary hover:text-accent-positive transition-colors disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false)
            setError(null)
          }}
          className="font-inter text-caption text-ink-secondary hover:text-ink-primary transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
