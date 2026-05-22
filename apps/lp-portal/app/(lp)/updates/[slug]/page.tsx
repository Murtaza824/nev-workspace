import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/format'
import { UpdateBody } from '@/components/lp/UpdateBody'
import type { Update } from '@/lib/types'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('updates')
    .select('title')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  const title = (data as { title?: string } | null)?.title ?? 'Update'

  return {
    title,
    robots: { index: false, follow: false },
  }
}

type UpdateWithAuthor = Update & {
  profiles: { full_name: string | null } | null
}

export default async function UpdateDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: rawUpdate, error } = await supabase
    .from('updates')
    .select('*, profiles(full_name)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !rawUpdate) notFound()

  const update = rawUpdate as UpdateWithAuthor
  const authorName = update.profiles?.full_name ?? null

  const wordCount = update.body_md
    ? update.body_md.split(/\s+/).filter(Boolean).length
    : 0
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <div className="mx-auto max-w-[680px] px-5 py-8 md:px-8 animate-fade-up">
      {/* Back link */}
      <Link
        href="/updates"
        className="inline-flex items-center gap-1 font-inter text-body text-accent-positive mb-8 hover:opacity-80 transition-opacity"
      >
        ← Updates
      </Link>

      {/* Eyebrow: date */}
      {update.published_at && (
        <p className="font-mono text-mono-sm text-ink-secondary uppercase mb-3">
          {formatDate(update.published_at)}
        </p>
      )}

      {/* Title */}
      <h1 className="font-fraunces text-display-1-mobile md:text-display-1 text-ink-primary leading-tight mb-3">
        {update.title}
      </h1>

      {/* Subtitle */}
      {update.subtitle && (
        <p className="font-fraunces italic text-heading-mobile md:text-heading text-ink-secondary leading-relaxed mt-3 mb-5">
          {update.subtitle}
        </p>
      )}

      {/* Author byline */}
      {authorName && (
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-full bg-surface-warm border border-border-hairline flex items-center justify-center shrink-0">
            <span className="font-inter text-[12px] text-ink-secondary">
              {authorName.charAt(0)}
            </span>
          </div>
          <span className="font-inter text-body text-ink-secondary">{authorName}</span>
          <span className="font-inter text-caption text-ink-tertiary">
            · {readingMinutes} min read
          </span>
        </div>
      )}

      <hr className="border-border-hairline mb-8" />

      {/* Article body */}
      {update.body_md && (
        <UpdateBody markdown={update.body_md} />
      )}

      {/* PDF download */}
      {update.pdf_url && (
        <div className="mt-10">
          <a
            href={update.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center rounded-input bg-ink-primary px-6 font-inter text-body text-white transition-opacity duration-200 hover:opacity-90 h-12 md:inline-flex md:w-auto md:h-10"
          >
            Download PDF version
          </a>
        </div>
      )}

      {/* Footer back link */}
      <div className="mt-12 border-t border-border-hairline pt-6">
        <Link
          href="/updates"
          className="font-inter text-body text-accent-positive hover:opacity-80 transition-opacity"
        >
          ← Back to updates
        </Link>
      </div>
    </div>
  )
}
