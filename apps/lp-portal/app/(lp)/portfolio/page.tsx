import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PortfolioTable } from '@/components/lp/PortfolioTable'
import { PortfolioMobileList } from '@/components/lp/PortfolioMobileList'
import { CostValueBars } from '@/components/lp/CostValueBars'
import type { PortfolioCompany, CoInvestor } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Portfolio',
  robots: { index: false, follow: false },
}

export default async function PortfolioPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [companiesResult, coInvestorsResult] = await Promise.all([
    supabase
      .from('portfolio_companies')
      .select('*')
      .eq('status', 'active')
      .order('invested_date', { ascending: false }),
    supabase.from('co_investors').select('*').order('order'),
  ])

  const companies = (companiesResult.data ?? []) as PortfolioCompany[]
  const allCoInvestors = (coInvestorsResult.data ?? []) as CoInvestor[]

  // Group co-investors by company_id
  const coInvestorMap: Record<string, CoInvestor[]> = {}
  for (const ci of allCoInvestors) {
    if (!coInvestorMap[ci.company_id]) {
      coInvestorMap[ci.company_id] = []
    }
    coInvestorMap[ci.company_id].push(ci)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 animate-fade-up">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="font-fraunces text-display-2-mobile md:text-display-2 text-ink-primary mb-1">
          NEV portfolio
        </h1>
        <p className="font-inter text-body text-ink-secondary">
          {companies.length} active {companies.length === 1 ? 'investment' : 'investments'} · Fund I
        </p>
      </div>

      {/* Desktop table — shown md and above */}
      <div className="hidden md:block">
        <PortfolioTable companies={companies} coInvestors={coInvestorMap} />
      </div>

      {/* Mobile card list — shown below md */}
      <div className="block md:hidden">
        <PortfolioMobileList companies={companies} />
      </div>

      {/* Cost vs. value bars — both viewports */}
      <CostValueBars companies={companies} />
    </div>
  )
}
