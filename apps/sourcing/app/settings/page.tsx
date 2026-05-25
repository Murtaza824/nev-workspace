import Link from 'next/link'

type SourceConfig = {
  name: string
  icon: string
  description: string
  status: 'active' | 'inactive' | 'coming_soon'
}

const SOURCES: SourceConfig[] = [
  {
    name: 'LinkedIn + Crustdata',
    icon: 'ti-database',
    description: 'Enriches tracked alumni with current title, company, GitHub, and Twitter. Detects job changes and stealth entries. Runs every 6 hours.',
    status: 'active',
  },
  {
    name: 'GitHub watch',
    icon: 'ti-brand-github',
    description: 'Monitors tracked people for new GitHub org creation — a strong signal for company formation. Requires GITHUB_PAT in Vercel env.',
    status: 'active',
  },
  {
    name: 'WHOIS watch',
    icon: 'ti-world',
    description: 'Runs reverse WHOIS lookups on tracked alumni to detect domain registrations. Requires WHOXY_API_KEY in Vercel env.',
    status: 'active',
  },
  {
    name: 'OpenCorporates',
    icon: 'ti-building',
    description: 'Delaware entity filings — a strong new-company signal. Pending a cost-effective API plan.',
    status: 'coming_soon',
  },
]

const SCORE_WEIGHTS = [
  { label: 'RECENCY', max: 30, description: '≤7d → 30 · ≤14d → 20 · ≤30d → 10 · older → 0' },
  { label: 'DENSITY', max: 30, description: '3+ signals / 60d → 30 · 2 signals → 20 · 1 → 10' },
  { label: 'CLUSTER', max: 15, description: 'Cofounder cluster match (stealth + shared prior co) → 15' },
  { label: 'SENIORITY', max: 15, description: 'Founder → 15 · VP → 12 · Staff → 10 · Senior → 5 · IC → 2' },
  { label: 'TIER', max: 10, description: 'Tier-1 alumni → 10' },
]

export default function SettingsPage() {
  return (
    <main
      className="min-h-screen px-6 py-4"
      style={{ backgroundColor: 'var(--color-background-primary)' }}
    >
      {/* Back nav */}
      <div className="mb-[14px]">
        <Link
          href="/"
          className="inline-flex items-center gap-[6px] text-[12px]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: '14px' }} aria-hidden="true" />
          Feed
        </Link>
      </div>

      <div
        className="pb-[14px] mb-[20px]"
        style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}
      >
        <div className="text-[17px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
          Settings
        </div>
        <div
          className="text-[12px] mt-[2px]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          API keys and configuration are managed in the Vercel dashboard.
        </div>
      </div>

      {/* Signal sources */}
      <section className="mb-[28px]">
        <div
          className="font-mono text-[10px] tracking-[0.06em] mb-[12px]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          SIGNAL SOURCES
        </div>
        <div className="flex flex-col gap-[1px]">
          {SOURCES.map((source, i) => (
            <div
              key={source.name}
              className="flex items-start gap-[12px] py-[12px]"
              style={
                i < SOURCES.length - 1
                  ? { borderBottom: '0.5px solid var(--color-border-tertiary)' }
                  : undefined
              }
            >
              <div
                className="w-[32px] h-[32px] rounded-[7px] flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--color-background-secondary)' }}
              >
                <i
                  className={`ti ${source.icon}`}
                  style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-[8px] mb-[2px]">
                  <span
                    className="text-[13px] font-medium"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {source.name}
                  </span>
                  <StatusPill status={source.status} />
                </div>
                <p
                  className="text-[12px] leading-[1.5]"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {source.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Score weights */}
      <section>
        <div
          className="font-mono text-[10px] tracking-[0.06em] mb-[12px]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          SCORE WEIGHTS
        </div>
        <div className="flex flex-col">
          {SCORE_WEIGHTS.map((w, i) => (
            <div
              key={w.label}
              className="flex items-start gap-[16px] py-[10px]"
              style={
                i < SCORE_WEIGHTS.length - 1
                  ? { borderBottom: '0.5px solid var(--color-border-tertiary)' }
                  : undefined
              }
            >
              <div className="flex items-baseline gap-[6px] flex-shrink-0" style={{ minWidth: '100px' }}>
                <span
                  className="font-mono text-[10px] tracking-[0.06em]"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {w.label}
                </span>
                <span
                  className="font-mono text-[15px] font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  /{w.max}
                </span>
              </div>
              <p
                className="text-[12px] leading-[1.5]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {w.description}
              </p>
            </div>
          ))}
        </div>
        <div
          className="mt-[12px] font-mono text-[10px]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Total capped at 100. Score ≥ 85 renders in teal.
        </div>
      </section>
    </main>
  )
}

function StatusPill({ status }: { status: 'active' | 'inactive' | 'coming_soon' }) {
  if (status === 'active') {
    return (
      <span
        className="font-mono text-[10px] tracking-[0.06em] px-[6px] py-[1px] rounded-[4px]"
        style={{ background: '#E1F5EE', color: '#085041' }}
      >
        ACTIVE
      </span>
    )
  }
  if (status === 'coming_soon') {
    return (
      <span
        className="font-mono text-[10px] tracking-[0.06em] px-[6px] py-[1px] rounded-[4px]"
        style={{
          background: 'var(--color-background-secondary)',
          color: 'var(--color-text-tertiary)',
        }}
      >
        COMING SOON
      </span>
    )
  }
  return (
    <span
      className="font-mono text-[10px] tracking-[0.06em] px-[6px] py-[1px] rounded-[4px]"
      style={{
        background: 'var(--color-background-secondary)',
        color: 'var(--color-text-tertiary)',
      }}
    >
      INACTIVE
    </span>
  )
}
