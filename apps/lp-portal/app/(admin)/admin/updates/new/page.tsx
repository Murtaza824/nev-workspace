import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { UpdateEditorForm } from '@/components/admin/UpdateEditorForm'
import type { PortfolioCompany } from '@/lib/types'

export default async function AdminUpdatesNewPage() {
  const adminSupabase = createAdminClient()
  const { data } = await adminSupabase
    .from('portfolio_companies')
    .select('id, name, slug')
    .order('name')

  const companies = (data ?? []) as PortfolioCompany[]

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8 animate-fade-up">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link href="/admin/updates" className="font-inter text-body text-ink-secondary hover:text-ink-primary transition-colors duration-200">
          ← Updates
        </Link>
      </nav>

      <h1 className="font-fraunces text-display-2-mobile md:text-display-2 text-ink-primary mb-8">
        New update
      </h1>

      <UpdateEditorForm companies={companies} mode="create" />
    </div>
  )
}
