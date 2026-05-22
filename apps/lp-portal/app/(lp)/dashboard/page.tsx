import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatUSD, formatMult, formatDate } from '@/lib/format'
import { EyebrowCaption } from '@/components/ui/EyebrowCaption'
import { StatBlock } from '@/components/ui/StatBlock'
import type { Fund, Profile, LpEntity, Update } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

type ProfileWithEntity = Profile & {
  lp_entities: LpEntity | null
}

type UpdateWithAuthor = Update & {
  profiles: { full_name: string | null } | null
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [fundResult, profileResult, updateResult, companiesCountResult] = await Promise.all([
    supabase.from('fund').select('*').single(),
    supabase
      .from('profiles')
      .select('*, lp_entities(*)')
      .eq('id', user.id)
      .single(),
    supabase
      .from('updates')
      .select('id, slug, title, excerpt, body_md, published_at, profiles(full_name)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('portfolio_companies')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
  ])

  const fund = fundResult.data as Fund | null
  const profile = profileResult.data as ProfileWithEntity | null
  const entity: LpEntity | null = profile?.lp_entities ?? null
  const investmentCount = companiesCountResult.count ?? 0

  // Effective commitment: entity overrides profile
  const effectiveCommitment =
    entity?.commitment_amount ?? profile?.commitment_amount ?? 0

  // Fund figures (with null-guards)
  const fundSize = fund?.fund_size ?? fund?.total_committed ?? 0
  const totalCommitted = fund?.total_committed ?? 0
  const totalCalled = fund?.total_called ?? 0
  const totalDeployed = fund?.total_deployed ?? 0
  const totalCurrentValue = fund?.total_current_value ?? 0

  // LP pro-rata calculations
  // Call ratio uses total_committed (actual wired capital) as the base
  const callRatio = totalCommitted > 0 ? totalCalled / totalCommitted : 0
  const lpCalled = effectiveCommitment * callRatio
  const callPct = Math.round(callRatio * 100)

  // LP current value = LP ownership % × (investment current value + uninvested cash)
  const lpOwnershipPct = totalCommitted > 0 ? effectiveCommitment / totalCommitted : 0
  const uninvestedCash = Math.max(0, totalCalled - totalDeployed)
  const lpCurrentValue = lpOwnershipPct * (totalCurrentValue + uninvestedCash)

  const grossMoic = totalDeployed > 0 ? totalCurrentValue / totalDeployed : 0

  // Multiple coloring
  const moicColor =
    grossMoic >= 1.0
      ? 'font-mono text-mono-lg-mobile md:text-mono-lg text-accent-positive'
      : grossMoic < 0.95
        ? 'font-mono text-mono-lg-mobile md:text-mono-lg text-accent-negative'
        : 'font-mono text-mono-lg-mobile md:text-mono-lg text-ink-primary'

  const currentValueColor =
    lpCurrentValue >= effectiveCommitment
      ? 'font-mono text-mono-lg-mobile md:text-mono-lg text-accent-positive'
      : 'font-mono text-mono-lg-mobile md:text-mono-lg text-ink-primary'

  // Latest update
  const latestUpdate = updateResult.data as UpdateWithAuthor | null

  const excerpt =
    latestUpdate?.excerpt ??
    (latestUpdate?.body_md
      ? latestUpdate.body_md.replace(/[#*_`[\]]/g, '').slice(0, 160)
      : null)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 animate-fade-up">
      {/* ── Block 1: Personal slice ─────────────────────────────────────── */}
      <section aria-labelledby="personal-heading">
        <EyebrowCaption className="mb-6">Your position · Fund I</EyebrowCaption>
        {/* Stats: 1-up mobile, 3-up desktop */}
        <div className="flex flex-col gap-6 md:flex-row md:gap-12">
          <StatBlock
            label="Your commitment"
            value={formatUSD(effectiveCommitment)}
            secondary={`${formatUSD(lpCalled)} called (${callPct}%)`}
          />
          <StatBlock
            label="Current value"
            value={formatUSD(lpCurrentValue)}
            valueClassName={currentValueColor}
          />
          <StatBlock
            label="Gross MOIC"
            value={formatMult(grossMoic)}
            valueClassName={moicColor}
          />
        </div>
        {fund?.as_of_date && (
          <p className="mt-4 font-inter text-caption text-ink-secondary">
            As of <span className="font-mono">{formatDate(fund.as_of_date)}</span> · Net of fees and carry not yet applied
          </p>
        )}
      </section>

      {/* ── Block 2: Fund snapshot ──────────────────────────────────────── */}
      <section aria-labelledby="fund-heading" className="mt-10 md:mt-[64px]">
        <EyebrowCaption className="mb-6">NEV Fund I Performance</EyebrowCaption>
        {/* 2-across × 3-rows mobile, 3-across × 2-rows desktop */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-8 md:grid-cols-3">
          <StatBlock label="Investments" value={String(investmentCount)} />
          <StatBlock
            label="Capital committed"
            value={formatUSD(totalCommitted)}
          />
          <StatBlock
            label="Capital called"
            value={formatUSD(totalCalled)}
            secondary={`${callPct}% of committed`}
          />
          <StatBlock
            label="Capital deployed"
            value={formatUSD(totalDeployed)}
          />
          <StatBlock
            label="Current value"
            value={formatUSD(totalCurrentValue)}
          />
          <StatBlock
            label="Gross MOIC"
            value={formatMult(grossMoic)}
            valueClassName="font-mono text-mono-lg-mobile md:text-mono-lg text-accent-positive"
          />
        </div>
      </section>

      {/* ── Block 3: Latest update ──────────────────────────────────────── */}
      <section aria-labelledby="updates-heading" className="mt-10 md:mt-[64px]">
        <EyebrowCaption className="mb-6">Latest from the GP</EyebrowCaption>

        {latestUpdate ? (
          <Link
            href={`/updates/${latestUpdate.slug}`}
            className="block rounded-card border border-border-hairline p-6 transition-shadow duration-200 hover:shadow-card-hover"
          >
            {latestUpdate.published_at && (
              <p className="font-mono text-mono-sm text-ink-secondary mb-2">
                {formatDate(latestUpdate.published_at)}
              </p>
            )}
            <h2 className="font-fraunces text-[20px] leading-tight text-ink-primary mb-2 md:text-[22px]">
              {latestUpdate.title}
            </h2>
            {excerpt && (
              <p className="font-inter text-body text-ink-secondary line-clamp-2 mb-4">
                {excerpt}
              </p>
            )}
            <span className="font-inter text-body text-accent-positive">
              Continue reading →
            </span>
          </Link>
        ) : (
          <div className="rounded-card border border-border-hairline p-6">
            <p className="font-inter text-body text-ink-secondary">
              Updates from the team coming soon.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
