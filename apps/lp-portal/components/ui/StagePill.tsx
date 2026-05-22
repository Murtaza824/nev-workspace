import type { PortfolioCompany } from '@/lib/types'

type Stage = PortfolioCompany['stage']

const stageStyles: Record<NonNullable<Stage>, string> = {
  'Pre-Seed': 'bg-pill-mint-bg text-pill-mint-ink',
  'First Check': 'bg-pill-peach-bg text-pill-peach-ink',
  'Seed': 'bg-pill-slate-bg text-pill-slate-ink',
  'Series A': 'bg-pill-slate-bg text-pill-slate-ink',
}

interface StagePillProps {
  stage: Stage
  className?: string
}

export function StagePill({ stage, className = '' }: StagePillProps) {
  if (!stage) return null

  return (
    <span
      className={`inline-block rounded-pill px-2 py-0.5 font-inter text-caption leading-tight ${stageStyles[stage]} ${className}`}
    >
      {stage}
    </span>
  )
}
