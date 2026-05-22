interface StatBlockProps {
  label: string
  value: string
  secondary?: string
  valueClassName?: string
  className?: string
}

/**
 * Reusable stat display: caption label above a monospace number.
 * Optional secondary line (smaller, secondary ink) beneath the value.
 */
export function StatBlock({
  label,
  value,
  secondary,
  valueClassName = 'font-mono text-mono-lg-mobile md:text-mono-lg text-ink-primary',
  className = '',
}: StatBlockProps) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className="font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary">
        {label}
      </span>
      <span className={valueClassName}>{value}</span>
      {secondary && (
        <span className="font-mono text-mono-sm text-ink-secondary">{secondary}</span>
      )}
    </div>
  )
}
