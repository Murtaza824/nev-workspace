import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/format'
import type { Profile } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Updates',
  robots: { index: false, follow: false },
}

type UpdateWithAuthor = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  body_md: string | null
  published_at: string | null
  profiles: Pick<Profile, 'full_name'> | null
}

export default async function UpdatesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: updates } = await supabase
    .from('updates')
    .select('id, slug, title, excerpt, body_md, published_at, profiles(full_name)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const publishedUpdates = (updates ?? []) as unknown as UpdateWithAuthor[]

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 animate-fade-up">
      {/* Page header */}
      <h1 className="font-fraunces text-display-2-mobile md:text-display-2 text-ink-primary mb-2">
        Updates
      </h1>
      <p className="font-inter text-[17px] md:text-[18px] text-ink-secondary mb-10">
        Letters and notes from the New Era Ventures team.
      </p>

      {/* Empty state */}
      {publishedUpdates.length === 0 && (
        <p className="font-inter text-body text-ink-secondary text-center">
          No updates yet. Check back soon.
        </p>
      )}

      {/* Update cards */}
      {publishedUpdates.length > 0 && (
        <ul>
          {publishedUpdates.map((update) => {
            const excerpt =
              update.excerpt ??
              (update.body_md
                ? update.body_md.replace(/[#*_`[\]]/g, '').slice(0, 160)
                : null)

            return (
              <li key={update.id} className="border-b border-border-hairline">
                <Link
                  href={`/updates/${update.slug}`}
                  className="block py-8 cursor-pointer group"
                >
                  {/* Date */}
                  {update.published_at && (
                    <p className="font-mono text-mono-sm text-ink-secondary uppercase mb-3">
                      {formatDate(update.published_at)}
                    </p>
                  )}

                  {/* Title */}
                  <h2 className="font-fraunces text-[22px] md:text-[28px] text-ink-primary leading-tight mb-2 group-hover:text-accent-positive transition-colors duration-200">
                    {update.title}
                  </h2>

                  {/* Excerpt */}
                  {excerpt && (
                    <p className="font-inter text-[15px] md:text-[16px] text-ink-secondary line-clamp-2 mb-4">
                      {excerpt}
                    </p>
                  )}

                  {/* Author byline */}
                  {update.profiles?.full_name && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-surface-warm border border-border-hairline flex items-center justify-center shrink-0">
                        <span className="font-inter text-[10px] text-ink-secondary">
                          {update.profiles.full_name.charAt(0)}
                        </span>
                      </div>
                      <span className="font-inter text-caption text-ink-secondary">
                        {update.profiles.full_name}
                      </span>
                    </div>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
