-- ============================================================
-- Phase 1: sourcing_* tables for NEV Signal
-- All tables prefixed sourcing_ to keep namespace clean.
-- RLS: only users with 'sourcing' in app_access and status = 'active'.
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. sourcing_clusters
--    Created first because sourcing_signals references it.
-- ──────────────────────────────────────────────────────────

create table if not exists public.sourcing_clusters (
  id                  uuid        primary key default gen_random_uuid(),
  cluster_type        text        not null check (cluster_type in ('multi_signal', 'cofounder_pair')),
  primary_entity_type text        check (primary_entity_type in ('person', 'company')),
  primary_entity_id   uuid,
  signal_count        int         not null default 1,
  earliest_signal_at  timestamptz not null,
  latest_signal_at    timestamptz not null,
  created_at          timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────
-- 2. sourcing_people
--    The monitoring pool — 2,000+ ex-tier-1 alumni we track.
-- ──────────────────────────────────────────────────────────

create table if not exists public.sourcing_people (
  id               uuid        primary key default gen_random_uuid(),
  linkedin_url     text        unique,
  full_name        text        not null,
  current_title    text,
  current_company  text,
  prior_companies  text[]      not null default '{}',
  tier_1_alum      boolean     not null default false,
  tier_1_companies text[]      not null default '{}',
  seniority_tier   text        check (seniority_tier in ('founder', 'vp', 'staff', 'senior', 'ic')),
  location         text,
  github_username  text,
  twitter_handle   text,
  created_at       timestamptz not null default now(),
  last_enriched_at timestamptz,
  data             jsonb       not null default '{}'
);

create index if not exists sourcing_people_tier1_idx
  on public.sourcing_people (tier_1_alum) where tier_1_alum = true;

create index if not exists sourcing_people_prior_companies_idx
  on public.sourcing_people using gin (prior_companies);

-- ──────────────────────────────────────────────────────────
-- 3. sourcing_companies
--    Companies detected or actively tracked.
-- ──────────────────────────────────────────────────────────

create table if not exists public.sourcing_companies (
  id                   uuid        primary key default gen_random_uuid(),
  name                 text        not null,
  domain               text,
  linkedin_url         text,
  status               text        check (status in ('public', 'stealth', 'announced', 'shut_down')),
  founded_at           date,
  delaware_filed_at    date,
  domain_registered_at date,
  github_org           text,
  headcount            int,
  created_at           timestamptz not null default now(),
  data                 jsonb       not null default '{}'
);

create index if not exists sourcing_companies_status_idx
  on public.sourcing_companies (status);

-- ──────────────────────────────────────────────────────────
-- 4. sourcing_signals
--    Unified event log. One row per detected signal.
-- ──────────────────────────────────────────────────────────

create table if not exists public.sourcing_signals (
  id              uuid        primary key default gen_random_uuid(),
  signal_type     text        not null check (signal_type in (
                    'stealth_entry', 'job_change', 'new_company',
                    'hiring_spike', 'domain_registered',
                    'github_org_created', 'delaware_filing'
                  )),
  source          text        not null check (source in (
                    'crustdata', 'github', 'opencorporates', 'whois'
                  )),
  person_id       uuid        references public.sourcing_people(id),
  company_id      uuid        references public.sourcing_companies(id),
  detected_at     timestamptz not null default now(),
  event_at        timestamptz,
  summary         text,
  evidence        jsonb       not null default '{}',
  score           int         check (score between 0 and 100),
  score_breakdown jsonb,
  cluster_id      uuid        references public.sourcing_clusters(id),
  status          text        not null default 'new' check (status in (
                    'new', 'reviewed', 'snoozed', 'passed', 'pursuing'
                  ))
);

-- Dedup: prevent re-inserting same event across runs
create unique index if not exists sourcing_signals_dedup_idx
  on public.sourcing_signals (person_id, signal_type, event_at)
  where person_id is not null and event_at is not null;

create index if not exists sourcing_signals_feed_idx
  on public.sourcing_signals (status, score desc);

create index if not exists sourcing_signals_detected_idx
  on public.sourcing_signals (detected_at desc);

create index if not exists sourcing_signals_person_idx
  on public.sourcing_signals (person_id);

create index if not exists sourcing_signals_company_idx
  on public.sourcing_signals (company_id);

-- ──────────────────────────────────────────────────────────
-- 5. sourcing_watchlists
--    Saved filter configurations per user.
-- ──────────────────────────────────────────────────────────

create table if not exists public.sourcing_watchlists (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id),
  name       text        not null,
  filters    jsonb       not null default '{}',
  created_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────
-- 6. Enable RLS
-- ──────────────────────────────────────────────────────────

alter table public.sourcing_clusters   enable row level security;
alter table public.sourcing_people     enable row level security;
alter table public.sourcing_companies  enable row level security;
alter table public.sourcing_signals    enable row level security;
alter table public.sourcing_watchlists enable row level security;

-- ──────────────────────────────────────────────────────────
-- 7. RLS policies — read access for sourcing users
-- ──────────────────────────────────────────────────────────

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'sourcing_clusters' and policyname = 'sourcing users read clusters') then
    create policy "sourcing users read clusters" on public.sourcing_clusters
      for select using (
        exists (select 1 from public.profiles where id = auth.uid() and 'sourcing' = any(app_access) and status = 'active')
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'sourcing_people' and policyname = 'sourcing users read people') then
    create policy "sourcing users read people" on public.sourcing_people
      for select using (
        exists (select 1 from public.profiles where id = auth.uid() and 'sourcing' = any(app_access) and status = 'active')
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'sourcing_companies' and policyname = 'sourcing users read companies') then
    create policy "sourcing users read companies" on public.sourcing_companies
      for select using (
        exists (select 1 from public.profiles where id = auth.uid() and 'sourcing' = any(app_access) and status = 'active')
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'sourcing_signals' and policyname = 'sourcing users read signals') then
    create policy "sourcing users read signals" on public.sourcing_signals
      for select using (
        exists (select 1 from public.profiles where id = auth.uid() and 'sourcing' = any(app_access) and status = 'active')
      );
  end if;
end $$;

-- Sourcing users can update signal status (pursuing / pass / snooze)
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'sourcing_signals' and policyname = 'sourcing users update signal status') then
    create policy "sourcing users update signal status" on public.sourcing_signals
      for update using (
        exists (select 1 from public.profiles where id = auth.uid() and 'sourcing' = any(app_access) and status = 'active')
      );
  end if;
end $$;

-- Watchlists scoped to the owning user
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'sourcing_watchlists' and policyname = 'users manage own watchlists') then
    create policy "users manage own watchlists" on public.sourcing_watchlists
      for all using (user_id = auth.uid());
  end if;
end $$;
