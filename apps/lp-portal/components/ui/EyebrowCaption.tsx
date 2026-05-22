interface EyebrowCaptionProps {
  children: React.ReactNode
  className?: string
}

/**
 * Uppercase caption eyebrow with 0.08em tracking.
 * Used as section headers above stat blocks and content sections.
 */
export function EyebrowCaption({ children, className = '' }: EyebrowCaptionProps) {
  return (
    <p
      className={`font-inter text-caption uppercase tracking-[0.08em] text-ink-secondary ${className}`}
    >
      {children}
    </p>
  )
}
