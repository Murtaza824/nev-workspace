# NEV Signal — sourcing tool PRD

**Status**: draft for build · **Owner**: Murtaza · **Last updated**: May 2026

## TL;DR

NEV Signal is a deal sourcing tool for Murtaza and Carter. It continuously ingests signals from Crustdata, GitHub, Delaware corporate filings, and domain registration data — then surfaces the highest-fit founder signals in a ranked feed. The thesis is encoded in the filter (ex-tier-1 alumni who have just entered stealth), not the score. The score answers: *is this real and is it fresh*.

V1 ships in roughly two weeks of focused build. Twitter, build-in-public detection, and LLM-as-judge scoring are deferred to v2.

## Context

NEV runs on a partner-led sourcing model with a small operating footprint. The bottleneck is not deciding what's interesting — Murtaza and Carter already know the thesis. The bottleneck is *catching it early*. By the time a stealth founder is on TechCrunch, the round is closed. The alpha is in the 30–90 day window between "left FAANG-tier company" and "raising a pre-seed."

NEV Signal closes that gap by polling the data sources where stealth founders unintentionally leak signal — LinkedIn headline changes, GitHub org creation, Delaware filings, domain registration — and clustering those signals against an alumni pool of eight high-prior companies.

This tool sits behind the NEV identity layer (see `nev-identity-layer-architecture.md`). Auth is solved. This doc only covers the sourcing tool itself.

## Goals (v1)

- Detect stealth founder signals from ex-employees of: OpenAI, Anthropic, Stripe, DeepMind, Ramp, SpaceX, Anduril, Palantir (configurable list)
- Rank signals with a deterministic, debuggable scoring engine
- Surface ranked feed in a clean, fast UI on `sourcing.neweraventures.com`
- Auto-detect cofounder clusters (2+ people from same prior co entering stealth in same window)
- Refresh continuously (every 6 hours v1, every 1 hour v2 if signal volume justifies)
- Track 2,000+ ex-alumni from the tier-1 list as the active monitoring pool

## Non-goals (v1)

- Twitter / X ingestion — v2
- Build-in-public thread detection — v2
- LLM-as-judge thesis scoring — v2
- CRM integration / deal pipeline — handled separately (future tool)
- Outbound automation (draft emails, warm intro paths) — future tool
- Mobile-first design — desktop only v1; mobile responsive v2

## Users

Two users in v1: Murtaza and Carter. Both have full access. Both have admin in the workspace identity layer.

Future users (interns, third partner, scout network) get scoped `app_access: ['sourcing']` via the admin app. No in-tool roles for v1 — if you're in, you see everything.

## Tech stack

- **Framework**: Next.js 15 (App Router), React 19
- **Hosting**: Vercel
- **Database**: Supabase (Postgres) — same project as the identity layer
- **Auth**: Supabase Auth via the workspace identity middleware
- **Background jobs**: Vercel Cron for scheduled triggers; Supabase Edge Functions for the actual workers (so they can read/write Supabase without leaving the platform)
- **UI**: Tailwind CSS + shadcn/ui components, custom design tokens matching the mockup
- **Data sources** (v1):
  - Crustdata API — person flow, company enrichment, headcount changes
  - GitHub REST API — org creation, repo activity for tracked individuals
  - OpenCorporates API or Delaware DOC scraper — new C-corp filings
  - WHOIS API (whoxy.com or similar) — new domain registrations by tracked individuals
- **Monorepo**: Turborepo, sourcing tool lives at `/apps/sourcing`

## Repo structure

```
nev-workspace/
├── apps/
│   ├── auth/          # auth.neweraventures.com (login/callback)
│   ├── admin/         # admin.neweraventures.com (user mgmt)
│   ├── lp-portal/     # lp.neweraventures.com (existing, migrated in)
│   └── sourcing/      # sourcing.neweraventures.com (this PRD)
├── packages/
│   ├── db/            # Supabase types, client, migrations
│   ├── ui/            # shared shadcn components, design tokens
│   ├── auth/          # access middleware, session helpers
│   └── ingestion/     # signal source connectors (Crustdata, GitHub, etc.)
├── CLAUDE.md          # root project context
├── turbo.json
└── package.json
```

The `packages/ingestion` package is the heart of this tool — each signal source is a module that conforms to a common interface, called by cron-triggered Edge Functions.

## Data model

All tables live in the same Supabase project as the identity layer, prefixed `sourcing_` to keep namespaces clean.

### `sourcing_people`

The monitoring pool — 2,000+ ex-tier-1 alumni we actively track.

```sql
create table public.sourcing_people (
  id uuid primary key default gen_random_uuid(),
  linkedin_url text unique,
  full_name text not null,
  current_title text,
  current_company text,
  prior_companies text[] not null default '{}',  -- normalized company names
  tier_1_alum boolean not null default false,    -- on the watchlist?
  tier_1_companies text[] not null default '{}', -- which ones
  seniority_tier text,  -- 'founder' | 'vp' | 'staff' | 'senior' | 'ic'
  location text,
  github_username text,
  twitter_handle text,
  created_at timestamptz not null default now(),
  last_enriched_at timestamptz,
  data jsonb default '{}'  -- raw Crustdata blob for re-processing
);

create index on public.sourcing_people (tier_1_alum) where tier_1_alum = true;
create index on public.sourcing_people using gin (prior_companies);
```

### `sourcing_companies`

Companies we've detected or are tracking — current employers of tracked people, plus net-new entities flagged by signals.

```sql
create table public.sourcing_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  linkedin_url text,
  status text,  -- 'public' | 'stealth' | 'announced' | 'shut_down'
  founded_at date,
  delaware_filed_at date,
  domain_registered_at date,
  github_org text,
  headcount int,
  created_at timestamptz not null default now(),
  data jsonb default '{}'
);

create index on public.sourcing_companies (status);
```

### `sourcing_signals`

The unified event log. One row per detected signal, regardless of source.

```sql
create table public.sourcing_signals (
  id uuid primary key default gen_random_uuid(),
  signal_type text not null,  -- 'stealth_entry' | 'job_change' | 'new_company' 
                              -- 'hiring_spike' | 'domain_registered' | 'github_org_created' 
                              -- 'delaware_filing'
  source text not null,       -- 'crustdata' | 'github' | 'opencorporates' | 'whois'
  person_id uuid references public.sourcing_people(id),
  company_id uuid references public.sourcing_companies(id),
  detected_at timestamptz not null default now(),
  event_at timestamptz,       -- when the underlying event happened (not detected)
  summary text,                -- one-sentence human-readable description
  evidence jsonb not null,    -- structured proof (URLs, before/after values, etc.)
  score int,                  -- computed by scoring engine, 0-100
  score_breakdown jsonb,      -- per-factor breakdown for the "why" panel
  cluster_id uuid references public.sourcing_clusters(id),
  status text not null default 'new'  -- 'new' | 'reviewed' | 'snoozed' | 'passed' | 'pursuing'
);

create index on public.sourcing_signals (status, score desc);
create index on public.sourcing_signals (detected_at desc);
create index on public.sourcing_signals (person_id);
create index on public.sourcing_signals (company_id);
```

### `sourcing_clusters`

When 2+ signals point to the same person/company within a window, or 2+ people from same prior co go stealth in a window, they cluster.

```sql
create table public.sourcing_clusters (
  id uuid primary key default gen_random_uuid(),
  cluster_type text not null,  -- 'multi_signal' | 'cofounder_pair'
  primary_entity_type text,    -- 'person' | 'company'
  primary_entity_id uuid,
  signal_count int not null default 1,
  earliest_signal_at timestamptz not null,
  latest_signal_at timestamptz not null,
  created_at timestamptz not null default now()
);
```

### `sourcing_watchlists`

Saved filter configurations per user.

```sql
create table public.sourcing_watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null,
  filters jsonb not null,  -- structured filter config
  created_at timestamptz not null default now()
);
```

### RLS policies

```sql
alter table public.sourcing_people enable row level security;
alter table public.sourcing_companies enable row level security;
alter table public.sourcing_signals enable row level security;
alter table public.sourcing_clusters enable row level security;
alter table public.sourcing_watchlists enable row level security;

-- Only users with 'sourcing' in app_access can read
create policy "sourcing access" on public.sourcing_signals
  for select using (
    exists (select 1 from public.profiles
            where id = auth.uid()
              and 'sourcing' = any(app_access)
              and status = 'active')
  );

-- (Same pattern for other sourcing_* tables)

-- Watchlists scoped to user
create policy "users manage own watchlists" on public.sourcing_watchlists
  for all using (user_id = auth.uid());
```

## Signal sources

Each source is a module in `packages/ingestion` conforming to:

```ts
export interface SignalSource {
  id: string
  run(ctx: IngestionContext): Promise<SignalBatch>
}
```

### 1. Crustdata person flow (`crustdata-person-flow`)

The workhorse. Crustdata's `person_changes` endpoint returns LinkedIn profile changes for tracked individuals over a time window.

**What we look for**:
- Title change to "Stealth" / "Building" / "Founder" / blank with employer cleared → `stealth_entry`
- Employer change from any of the 8 tier-1 companies → `job_change` (boost if new title indicates founding)
- Multiple field changes in 24h (title + employer + bio) → strong stealth signal

**Cadence**: every 6 hours. We pull deltas since last successful run; idempotent via Crustdata's `as_of` parameter.

**Cost note**: Crustdata pricing scales with tracked person count and refresh frequency. 2,000 people × 6h refresh ≈ tier we should confirm before scaling beyond.

### 2. Crustdata company enrichment (`crustdata-company-flow`)

For each `sourcing_companies` row in `stealth` status, poll for: headcount changes (>20% in 30d = `hiring_spike`), new key hires from tier-1 list, web traffic spikes, funding announcements.

### 3. GitHub watch (`github-watch`)

For each tracked person with a known `github_username`, poll their public activity weekly. Flag:
- New org created → `github_org_created`
- New repo with high commit velocity in non-personal namespace
- Joined a private org we haven't seen before (visible if they make public commits)

GitHub API rate limits are generous for authenticated requests (5,000/hr). Easy.

### 4. Delaware corporate filings (`delaware-filings`)

OpenCorporates API or Delaware DOC scraper. Daily run. Match new C-corp filings against names of tracked people (founder names appear in filings).

When a filing matches → `delaware_filing` signal, create `sourcing_companies` row if not extant.

### 5. Domain registration (`whois-monitor`)

WHOIS API. Daily run. Check for newly registered domains containing tokens from tracked people's name or known startup-naming patterns. Lower precision; treat as corroborating evidence only.

### Ingestion runtime

- Vercel Cron triggers a single `POST /api/cron/ingest` endpoint
- That endpoint enqueues each source as a Supabase Edge Function invocation
- Each source writes to `sourcing_signals` and updates `sourcing_people` / `sourcing_companies`
- Dedup is per-source via a `(person_id, signal_type, event_at)` unique constraint to prevent re-inserting the same event across runs
- After all sources complete, the scoring engine runs on new signals (status = 'new', score is null)

## Scoring engine

Deterministic. No LLM in v1. Each signal scored independently and stored with breakdown for transparency.

### Inputs and weights

| Factor | Range | Logic |
|--------|-------|-------|
| **Recency** | 0–30 | event_at ≤ 7d → 30 · 8–14d → 20 · 15–30d → 10 · >30d → 0 |
| **Signal density** | 0–30 | Count distinct signals on same person in 60d. 1 → 10 · 2 → 20 · 3+ → 30 |
| **Cofounder cluster** | 0–15 | +15 if another tier-1 alum from same prior co also has stealth signal in 60d window |
| **Seniority** | 0–15 | founder/CEO/CTO → 15 · VP/Director → 12 · Staff/Principal → 10 · Senior → 5 · IC → 2 |
| **Prior company tier** | 0–10 | On tier-1 list → 10 · On extended list → 5 · Other → 0 |

Total capped at 100.

### Scoring as a Postgres function

Implemented as a SQL function `sourcing_score_signal(signal_id uuid) returns int` so it can be called inline (on insert via trigger) or in batch (re-score everything after weight changes).

Storing the `score_breakdown` JSON next to the score is non-negotiable — when a 92 shows up, Murtaza needs to see "Recency 30 · Density 30 · Cluster 15 · Seniority 12 · Tier 5" in the detail panel.

### Tuning loop

Murtaza and Carter mark signals as `pursuing` or `passed` via the UI. After 30 days of usage, we have ground truth: did high-score signals actually convert to conversations? Re-tune weights. Not automated — manual review of misses and false positives, then config update.

## UI specification

Match the mockup shown in chat (NEV Signal feed). Single-column ranked feed, dense but breathable, monospace numerics, sentence case throughout.

### Routes

| Path | Purpose |
|------|---------|
| `/` | Ranked signal feed (today, this week, custom range) |
| `/signal/[id]` | Signal detail: score breakdown, evidence, related signals, actions |
| `/person/[id]` | Person profile: timeline of all signals, current/prior companies, links |
| `/company/[id]` | Company profile: detected entity, all linked signals and people |
| `/watchlists` | Saved filter configurations |
| `/watchlists/[id]` | Filtered feed view |
| `/settings` | Refresh cadence, alumni pool config, source API keys, score weights |

### Feed (`/`)

Components:
- Header: NEV Signal lockup · streaming indicator · search · filter button
- Filter chip row: All / Stealth / Job changes / New cos / Hiring spikes / Build-in-public (build-in-public hidden in v1)
- 4 metric cards: Signals 24h · High priority · Tracked people · Watchlists
- Feed: row per signal, sorted by score desc, infinite scroll
- Bottom bar: showing N of M · last refresh time · ⌘K shortcuts

Each feed row shows: avatar/initials, name, one-line context, signal type pill, summary sentence, source attribution, time ago, signal count, FIT score (large mono right-aligned).

Clicking a row → `/signal/[id]`.

### Signal detail (`/signal/[id]`)

- Header: person/company name, signal type, score with mono breakdown
- Evidence panel: structured display of the evidence JSON — LinkedIn before/after, GitHub org URL, domain WHOIS, etc.
- Related signals: other signals on this person/company, chronological
- Cofounder cluster banner: if cluster_id is set, show the linked person and a "view pair" link
- Actions row: Mark pursuing · Snooze 30d · Pass · Add note · Send to Slack (v2)
- Notes section: free-text shared between Murtaza and Carter

### Person profile (`/person/[id]`)

Header card: photo, name, current title/company, tier-1 alum badge if applicable, links (LinkedIn, GitHub, Twitter, personal site).

Body: chronological timeline of all signals + a "current state" summary at top. 

### Settings (`/settings`)

For v1, keep this dead simple:
- Refresh cadence (radio: 1h, 6h, 24h)
- Tier-1 alumni list (editable text area, one company per line)
- Score weights (sliders, defaults from the table above)
- Source toggles (Crustdata, GitHub, Delaware, WHOIS — on/off each)
- API key fields (Crustdata, GitHub PAT, OpenCorporates, WHOIS provider) — stored in Vercel env, displayed masked

## Cofounder clustering logic

The highest-alpha signal in the system. Logic:

1. New signal arrives with `signal_type = 'stealth_entry'` for person A
2. Query: any other person with `stealth_entry` signal in last 60d, where `prior_companies` overlap with A's `prior_companies`?
3. If match → create `sourcing_clusters` row of type `cofounder_pair`, link both signals to it
4. Boost both signals' scores by +15 on next score pass
5. UI: cluster banner on signal detail, dedicated cluster list on `/` filtered by `cluster_type = 'cofounder_pair'`

Edge case: 3+ people from same prior co cluster into a single cluster row (not multiple pairwise clusters).

## Build phases

Each phase ends with a verifiable success criterion. Claude Code can run the verification, confirm, and move on.

### Phase 0 — Bootstrap (Day 1)

Initialize monorepo, deploy skeleton, wire identity middleware.

- `pnpm create turbo@latest` → set up monorepo
- Create `apps/sourcing` with Next.js 15
- Install shadcn/ui, Tailwind, set up design tokens to match mockup
- Add access middleware from `packages/auth` (gates on `app_access` includes `'sourcing'`)
- Deploy to `sourcing.neweraventures.com`
- Hit the URL → redirected to auth → log in → see empty page

**Done when**: Murtaza can log in, hit the sourcing app, and see an empty "no signals yet" state. Access denial works for users without `'sourcing'` in app_access.

### Phase 1 — Data model + manual seed (Day 2)

Schema migrations + seed alumni pool manually.

- Write SQL migration for all `sourcing_*` tables + RLS
- Apply to Supabase project
- Seed `sourcing_people` with ~100 hand-picked tier-1 alumni via Crustdata person search (Murtaza + Carter pick the highest-priority initial cohort; auto-expand later)
- Implement and apply seed script: `apps/sourcing/scripts/seed-alumni.ts`

**Done when**: `sourcing_people` has 100+ rows with `tier_1_alum = true` and the join queries work. Visible in Supabase Studio.

### Phase 2 — First signal source: Crustdata person flow (Days 3–4)

Build the workhorse ingestion path.

- Implement `packages/ingestion/crustdata-person-flow`
- Build the Supabase Edge Function that calls it
- Wire Vercel Cron → `/api/cron/ingest` → Edge Function
- Run end-to-end manually first; confirm signals land in `sourcing_signals`
- Implement dedup constraint

**Done when**: A manual cron trigger produces real signals from real Crustdata data on real tracked people, with no duplicates on repeat runs.

### Phase 3 — Scoring engine + feed UI (Days 5–7)

The visible product.

- Implement `sourcing_score_signal` SQL function + post-insert trigger
- Build `/` feed page matching the mockup exactly
- Build signal row component
- Implement infinite scroll
- Implement filter chips (functional in this phase: All / Stealth / Job changes / New cos)
- Implement metric cards (computed from signals table)

**Done when**: Murtaza visits `sourcing.neweraventures.com` and sees the mockup-quality feed populated with real ranked signals from Crustdata.

### Phase 4 — Signal detail + actions (Day 8)

- `/signal/[id]` page with evidence panel + score breakdown
- Mark pursuing / snooze / pass actions
- Notes (shared between Murtaza and Carter)

**Done when**: Murtaza can click into a signal, see the "why," mark it pursuing, add a note. State persists.

### Phase 5 — Cofounder clustering (Day 9)

- Implement cluster detection logic in a post-ingest hook
- Cluster banner on signal detail
- Score boost integration

**Done when**: A synthetic pair (manually inserted: two ex-Stripe employees with stealth signals 5 days apart) is auto-clustered and visible as a pair.

### Phase 6 — Secondary sources (Days 10–12)

Add GitHub, Delaware filings, WHOIS workers. Same pattern as Crustdata.

**Done when**: All four sources are running on cron, contributing signals that feed into the same scoring pipeline.

### Phase 7 — Polish + settings + watchlists (Days 13–14)

- Person and Company profile pages
- Watchlists CRUD
- Settings page
- Performance pass: feed loads in <500ms on the partner Macs

**Done when**: Murtaza and Carter are using it daily. Twitter is the only obvious gap.

## Environment variables

Set in Vercel (and locally in `.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # server-only, never exposed
CRUSTDATA_API_KEY=
GITHUB_PAT=                     # fine-grained, read public + read user
OPENCORPORATES_API_KEY=
WHOXY_API_KEY=
NEV_PARENT_DOMAIN=neweraventures.com
NEV_AUTH_URL=https://auth.neweraventures.com
RESEND_API_KEY=                 # for any sourcing-specific emails (digest in v2)
```

## Out of scope (v2)

- Twitter ingestion (founder threads, build-in-public, follow patterns)
- LLM-as-judge for thesis fit on long-form content
- Hourly refresh (vs 6h)
- Daily digest email (Murtaza/Carter morning brief — 10 highest-score new signals)
- Slack integration (push high-score signals to a private channel)
- Outbound draft generation (suggested first-message based on tracked person's background)
- CRM handoff (export pursuing signals to whatever NEV's CRM ends up being)
- Mobile responsive UI

## Open questions

- **Crustdata pricing tier** — confirm 2,000-person tracking × 6h refresh fits within plan, or which plan we need. Block on starting Phase 2 if unclear.
- **OpenCorporates vs direct Delaware DOC** — OpenCorporates is paid; direct DOC is free but scrape-fragile. Start with OpenCorporates if budget allows; otherwise build a scraper in Phase 6.
- **Initial alumni pool size** — start at 100 and expand to 2,000? Or seed all 2,000 from day one and accept slower ingestion until tuning is done? Recommend 100 for fast iteration, expand after Phase 4.
- **Carter input on UX** — should Carter review the feed mockup before Phase 3 build starts, or trust Murtaza's sign-off? Faster to just build.
