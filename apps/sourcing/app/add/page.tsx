'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { addPerson, type AddPersonResult } from './actions'
import { getInitials } from '../lib/signal-helpers'

const initialState: AddPersonResult = { ok: false }

export default function AddPersonPage() {
  const [result, dispatch, isPending] = useActionState(addPerson, initialState)

  return (
    <main
      className="min-h-screen px-6 py-4"
      style={{ backgroundColor: 'var(--color-background-primary)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between pb-[14px]"
        style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}
      >
        <div className="flex items-center gap-[10px]">
          <Link href="/" className="flex items-center gap-[10px]">
            <div
              className="w-[30px] h-[30px] flex items-center justify-center font-mono text-[13px] font-medium flex-shrink-0"
              style={{
                borderRadius: '7px',
                background: 'var(--color-text-primary)',
                color: 'var(--color-background-primary)',
              }}
            >
              N
            </div>
            <div>
              <div className="text-[15px] font-medium leading-[1.2]">NEV Signal</div>
              <div
                className="font-mono text-[10px] mt-[2px] tracking-[0.08em]"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                ADD PERSON
              </div>
            </div>
          </Link>
        </div>
        <Link
          href="/"
          className="font-mono text-[11px] tracking-[0.06em]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: '14px' }} />
          {' '}BACK
        </Link>
      </div>

      <div className="max-w-[480px] pt-[32px]">
        <p
          className="text-[13px] mb-[20px]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Paste a LinkedIn or X/Twitter URL to manually add someone to the tracking pool.
          Crustdata will fill in the rest.
        </p>

        <form action={dispatch}>
          <div className="flex gap-[8px]">
            <input
              name="url"
              type="url"
              placeholder="linkedin.com/in/… or x.com/…"
              required
              defaultValue=""
              className="flex-1 font-mono text-[13px] px-[12px] py-[9px] outline-none"
              style={{
                border: '0.5px solid var(--color-border-secondary)',
                borderRadius: '7px',
                background: 'var(--color-background-primary)',
                color: 'var(--color-text-primary)',
              }}
            />
            <button
              type="submit"
              disabled={isPending}
              className="font-mono text-[12px] tracking-[0.06em] px-[14px] py-[9px] font-medium"
              style={{
                borderRadius: '7px',
                background: 'var(--color-text-primary)',
                color: 'var(--color-background-primary)',
                opacity: isPending ? 0.5 : 1,
                cursor: isPending ? 'not-allowed' : 'pointer',
              }}
            >
              {isPending ? 'LOOKING UP…' : 'ADD'}
            </button>
          </div>
        </form>

        {/* Error */}
        {!result.ok && result.error && (
          <p
            className="mt-[12px] text-[12px] font-mono"
            style={{ color: 'var(--color-accent-negative)' }}
          >
            {result.error}
          </p>
        )}

        {/* Success card */}
        {result.ok && result.person && (
          <div
            className="mt-[20px] flex items-start gap-[12px] px-[14px] py-[12px]"
            style={{
              border: '0.5px solid var(--color-border-secondary)',
              borderRadius: '8px',
              background: 'var(--color-background-secondary)',
            }}
          >
            <div
              className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-[12px] font-medium flex-shrink-0"
              style={{ background: '#E1F5EE', color: '#085041' }}
            >
              {getInitials(result.person.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-[8px]">
                <span className="text-[14px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {result.person.full_name}
                </span>
                <span
                  className="font-mono text-[10px] tracking-[0.06em] px-[6px] py-[1px]"
                  style={{ borderRadius: '4px', background: '#E1F5EE', color: '#085041' }}
                >
                  ADDED
                </span>
              </div>
              {(result.person.current_title || result.person.current_company) && (
                <div
                  className="text-[12px] mt-[2px]"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {result.person.current_title}
                  {result.person.current_title && result.person.current_company ? ' · ' : ''}
                  {result.person.current_company}
                </div>
              )}
              <div
                className="flex items-center gap-[10px] mt-[6px] font-mono text-[11px]"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {result.person.linkedin_url && (
                  <a href={result.person.linkedin_url} target="_blank" rel="noopener noreferrer">
                    <i className="ti ti-brand-linkedin" style={{ fontSize: '13px' }} />
                  </a>
                )}
                {result.person.twitter_handle && (
                  <a
                    href={`https://x.com/${result.person.twitter_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="ti ti-brand-x" style={{ fontSize: '13px' }} />
                  </a>
                )}
                <Link
                  href={`/person/${result.person.id}`}
                  className="underline underline-offset-2"
                >
                  view profile
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Prompt to add another after success */}
        {result.ok && (
          <form action={dispatch} className="mt-[12px]">
            <input name="url" type="hidden" value="" />
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="font-mono text-[11px] tracking-[0.04em]"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              + add another
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
