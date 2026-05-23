'use client'

import { useTransition } from 'react'
import { updateSignalStatus } from './actions'

type Status = 'new' | 'reviewed' | 'pursuing' | 'passed' | 'snoozed'

const STATUS_LABELS: Record<Status, string> = {
  new: 'New',
  reviewed: 'Reviewed',
  pursuing: 'Pursuing',
  passed: 'Passed',
  snoozed: 'Snoozed',
}

export function ActionButtons({ signalId, currentStatus }: { signalId: string; currentStatus: Status }) {
  const [isPending, startTransition] = useTransition()

  function act(status: 'pursuing' | 'passed' | 'snoozed') {
    startTransition(() => updateSignalStatus(signalId, status))
  }

  return (
    <div className="flex flex-wrap items-center gap-[8px]">
      <span
        className="font-mono text-[10px] tracking-[0.06em] px-[8px] py-[3px] rounded-[4px]"
        style={{ background: 'var(--color-background-secondary)', color: 'var(--color-text-tertiary)' }}
      >
        {STATUS_LABELS[currentStatus]}
      </span>

      {currentStatus !== 'pursuing' && (
        <button
          onClick={() => act('pursuing')}
          disabled={isPending}
          className="text-[12px] px-[11px] py-[4px] rounded-full cursor-pointer disabled:opacity-50"
          style={{ background: 'var(--color-text-primary)', color: 'var(--color-background-primary)' }}
        >
          Mark pursuing
        </button>
      )}
      {currentStatus !== 'snoozed' && (
        <button
          onClick={() => act('snoozed')}
          disabled={isPending}
          className="text-[12px] px-[11px] py-[4px] rounded-full cursor-pointer disabled:opacity-50"
          style={{ border: '0.5px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)' }}
        >
          Snooze 30d
        </button>
      )}
      {currentStatus !== 'passed' && (
        <button
          onClick={() => act('passed')}
          disabled={isPending}
          className="text-[12px] px-[11px] py-[4px] rounded-full cursor-pointer disabled:opacity-50"
          style={{ border: '0.5px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)' }}
        >
          Pass
        </button>
      )}
    </div>
  )
}
