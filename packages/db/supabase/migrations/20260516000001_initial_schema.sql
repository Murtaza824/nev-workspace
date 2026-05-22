-- ============================================================
-- NEV LP Portal — Initial Schema
-- Phase 2: All tables, RLS policies, profiles trigger
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- TABLES
-- ──────────────────────────────────────────────────────────

-- profiles: extends auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null check (role in ('lp', 'admin')) default 'lp',
  commitment_amount numeric,
  committed_at date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- fund: singleton row
create table public.fund (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'NEV Fund I',
  vintage integer default 2025,
  total_committed numeric,
  total_called numeric,
  total_deployed numeric,
  total_current_value numeric,
  as_of_date date,
  last_updated timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- portfolio_companies
create table public.portfolio_companies (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  logo_url text,
  one_liner text,
  sector text,
  website text,
  stage text check (stage in ('Pre-Seed', 'First Check', 'Seed', 'Series A')),
  status text check (status in ('active', 'exited', 'written_off')) default 'active',
  thesis text,
  invested_date date,
  check_size numeric,
  entry_valuation numeric,
  ownership_pct numeric,
  pro_rata_rights boolean default false,
  current_valuation numeric,
  current_multiple numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- valuation_events
create table public.valuation_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.portfolio_companies(id) on delete cascade,
  event_date date not null,
  event_type text check (event_type in ('markup', 'markdown', 'exit', 'writedown', 'initial')),
  new_company_valuation numeric,
  new_position_value numeric,
  multiple numeric,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- co_investors
create table public.co_investors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.portfolio_companies(id) on delete cascade,
  name text not null,
  "order" integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- updates
create table public.updates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  body_md text,
  excerpt text,
  author_id uuid references public.profiles(id),
  related_company_id uuid references public.portfolio_companies(id),
  pdf_url text,
  status text check (status in ('draft', 'published')) default 'draft',
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ──────────────────────────────────────────────────────────
-- RLS HELPER: is_admin()
-- Uses security definer to avoid infinite recursion when
-- profiles policies subquery the profiles table.
-- ──────────────────────────────────────────────────────────

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ──────────────────────────────────────────────────────────
-- ENABLE RLS
-- ──────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.fund enable row level security;
alter table public.portfolio_companies enable row level security;
alter table public.valuation_events enable row level security;
alter table public.co_investors enable row level security;
alter table public.updates enable row level security;

-- ──────────────────────────────────────────────────────────
-- RLS POLICIES
-- ──────────────────────────────────────────────────────────

-- profiles: LP reads own row; admin reads/writes all
create policy "lp reads own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "admin reads all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "admin writes profiles"
  on public.profiles for all
  using (public.is_admin());

-- fund: any authenticated user reads; admins write
create policy "authed reads fund"
  on public.fund for select
  using (auth.role() = 'authenticated');

create policy "admin writes fund"
  on public.fund for all
  using (public.is_admin());

-- portfolio_companies: any authenticated user reads; admins write
create policy "authed reads portfolio"
  on public.portfolio_companies for select
  using (auth.role() = 'authenticated');

create policy "admin writes portfolio"
  on public.portfolio_companies for all
  using (public.is_admin());

-- valuation_events: any authenticated user reads; admins write
create policy "authed reads valuation_events"
  on public.valuation_events for select
  using (auth.role() = 'authenticated');

create policy "admin writes valuation_events"
  on public.valuation_events for all
  using (public.is_admin());

-- co_investors: any authenticated user reads; admins write
create policy "authed reads co_investors"
  on public.co_investors for select
  using (auth.role() = 'authenticated');

create policy "admin writes co_investors"
  on public.co_investors for all
  using (public.is_admin());

-- updates: LPs see only published; admins see all
create policy "lp reads published updates"
  on public.updates for select
  using (status = 'published' or public.is_admin());

create policy "admin writes updates"
  on public.updates for all
  using (public.is_admin());

-- ──────────────────────────────────────────────────────────
-- PROFILES AUTO-CREATE TRIGGER
-- Fires after a new auth.users row is inserted.
-- ──────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'lp')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
