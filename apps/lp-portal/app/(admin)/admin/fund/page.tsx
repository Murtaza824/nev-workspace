import { createAdminClient } from '@/lib/supabase/server'
import { FundForm } from '@/components/admin/FundForm'
import type { Fund, PortfolioCompany } from '@/lib/types'

export default async function AdminFundPage() {
  const adminSupabase = createAdminClient()

  const [fundResult, companiesResult] = await Promise.all([
    adminSupabase.from('fund').select('*').single(),
    adminSupabase.from('portfolio_companies').select('*'),
  ])

  const fund = fundResult.data as Fund | null
  const companies = (companiesResult.data ?? []) as PortfolioCompany[]

  if (!fund) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
        <h1 className="font-fraunces text-display-2-mobile md:text-display-2 text-ink-primary mb-4">
          Fund
        </h1>
        <p className="font-inter text-body text-ink-secondary">
          No fund record found. Seed the database to create Fund I.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8 animate-fade-up">
      <div className="mb-8">
        <h1 className="font-fraunces text-display-2-mobile md:text-display-2 text-ink-primary mb-2">
          Fund
        </h1>
        <p className="font-inter text-body text-ink-secondary">
          Edit Fund I metrics. Changes are reflected immediately on LP dashboards.
        </p>
      </div>

      <FundForm fund={fund} companies={companies} />
    </div>
  )
}
