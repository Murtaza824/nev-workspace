'use client'

import Link from 'next/link'

export function PersonButton({ id }: { id: string }) {
  return (
    <Link
      href={`/person/${id}`}
      onClick={e => e.stopPropagation()}
      className="inline-flex items-center gap-[3px] cursor-pointer"
      style={{ color: 'var(--color-text-tertiary)', textDecoration: 'none' }}
      aria-label="View person profile"
    >
      <i className="ti ti-user" style={{ fontSize: '12px' }} aria-hidden="true" />
      <span>Profile</span>
    </Link>
  )
}
