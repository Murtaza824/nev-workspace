import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { UpdateEditorForm } from '@/components/admin/UpdateEditorForm'
import type { Update, PortfolioCompany } from '@/lib/types'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function AdminUpdatesEditPage({ params }: PageProps) {
  const { slug } = await params
  const adminSupabase = createAdminClient()

  const [updateResult, companiesResult] = await Promise.all([
    adminSupabase
      .from('updates')
      .select('*')
      .eq('slug', slug)
      .single(),
    adminSupabase
      .from('portfolio_companies')
      .select('id, name, slug')
      .order('name'),
  ])

  if (!updateResult.data) notFound()

  const update = updateResult.data as Update
  const companies = (companiesResult.data ?? []) as PortfolioCompany[]

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8 animate-fade-up">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link href="/admin/updates" className="font-inter text-body text-ink-secondary hover:text-ink-primary transition-colors duration-200">
          ← Updates
        </Link>
      </nav>

      <h1 className="font-fraunces text-display-2-mobile md:text-display-2 text-ink-primary mb-2">
        {update.title}
      </h1>
      <p className="font-inter text-body text-ink-secondary mb-8">
        {update.status === 'published' ? 'Published · Edit below' : 'Draft · Not visible to LPs'}
      </p>

      <UpdateEditorForm update={update} companies={companies} mode="edit" />
    </div>
  )
}
