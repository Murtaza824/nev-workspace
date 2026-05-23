'use client'

export function LinkedInButton({ url }: { url: string }) {
  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation()
        e.preventDefault()
        window.open(url, '_blank', 'noopener,noreferrer')
      }}
      className="inline-flex items-center gap-[3px] cursor-pointer"
      style={{ color: 'var(--color-text-tertiary)', background: 'none', border: 'none', padding: 0 }}
      aria-label="Open LinkedIn profile"
    >
      <i className="ti ti-brand-linkedin" style={{ fontSize: '12px' }} aria-hidden="true" />
      <span>LI</span>
    </button>
  )
}
