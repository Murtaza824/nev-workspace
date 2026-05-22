-- ============================================================
-- Identity layer — additive migration on the LP portal Supabase project.
-- This migration repurposes the existing project as the shared NEV workspace
-- identity layer. All new apps (sourcing, admin, auth) will authenticate
-- against this single project. The LP portal schema is preserved unchanged;
-- we only add the columns and tables the identity layer requires.
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. Expand the role check constraint on profiles
--    LP portal only had 'lp' | 'admin'; identity layer adds 'member' | 'intern'
-- ──────────────────────────────────────────────────────────

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'member', 'lp', 'intern'));

-- ──────────────────────────────────────────────────────────
-- 2. Add identity layer columns to profiles
-- ──────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists app_access text[] not null default '{}',
  add column if not exists status text not null default 'active',
  add column if not exists invited_by uuid,
  add column if not exists invited_at timestamptz,
  add column if not exists last_seen_at timestamptz;

-- Status constraint (idempotent via DO block)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_status_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_status_check
      check (status in ('active', 'invited', 'deactivated'));
  end if;
end;
$$;

-- FK for invited_by (idempotent via DO block)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_invited_by_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_invited_by_fkey
      foreign key (invited_by) references public.profiles(id);
  end if;
end;
$$;

-- ──────────────────────────────────────────────────────────
-- 3. Backfill app_access for existing profiles so the new
--    access-check middleware doesn't immediately lock everyone out
-- ──────────────────────────────────────────────────────────

update public.profiles
  set app_access = array['lp_portal']
where role = 'lp'
  and app_access = '{}';

update public.profiles
  set app_access = array['lp_portal', 'sourcing', 'admin']
where role = 'admin'
  and app_access = '{}';

-- ──────────────────────────────────────────────────────────
-- 4. Update is_admin() to also enforce status = 'active'
--    Previously this only checked role; now a deactivated admin is denied.
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
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

-- ──────────────────────────────────────────────────────────
-- 5. invitations table
-- ──────────────────────────────────────────────────────────

create table if not exists public.invitations (
  id          uuid        primary key default gen_random_uuid(),
  email       text        not null,
  role        text        not null check (role in ('admin', 'member', 'lp', 'intern')),
  app_access  text[]      not null default '{}',
  invited_by  uuid        not null references public.profiles(id),
  invited_at  timestamptz not null default now(),
  accepted_at timestamptz,
  token       text        not null unique,
  expires_at  timestamptz not null default (now() + interval '14 days')
);

create index if not exists invitations_email_pending_idx
  on public.invitations (email) where accepted_at is null;

create index if not exists invitations_token_idx
  on public.invitations (token);

-- ──────────────────────────────────────────────────────────
-- 6. tools table — lookup for the admin app's access checkboxes
-- ──────────────────────────────────────────────────────────

create table if not exists public.tools (
  id          text        primary key,
  name        text        not null,
  description text,
  active      boolean     not null default true,
  created_at  timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────
-- 7. Enable RLS on new tables
-- ──────────────────────────────────────────────────────────

alter table public.invitations enable row level security;
alter table public.tools       enable row level security;

-- ──────────────────────────────────────────────────────────
-- 8. RLS policies — invitations (admin-only)
-- ──────────────────────────────────────────────────────────

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'invitations'
      and policyname = 'admins manage invitations'
  ) then
    create policy "admins manage invitations" on public.invitations
      for all using (public.is_admin());
  end if;
end;
$$;

-- ──────────────────────────────────────────────────────────
-- 9. RLS policies — tools (authenticated users read; admins write)
-- ──────────────────────────────────────────────────────────

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'tools'
      and policyname = 'authenticated users read tools'
  ) then
    create policy "authenticated users read tools" on public.tools
      for select using (auth.role() = 'authenticated');
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'tools'
      and policyname = 'admins manage tools'
  ) then
    create policy "admins manage tools" on public.tools
      for all using (public.is_admin());
  end if;
end;
$$;

-- ──────────────────────────────────────────────────────────
-- 10. Profiles — add update policy for admins (not already covered by
--     the "admin writes profiles" FOR ALL policy from the initial migration)
--     If the FOR ALL policy already exists, this DO block skips it safely.
-- ──────────────────────────────────────────────────────────

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'profiles'
      and policyname = 'admins update profiles'
  ) then
    create policy "admins update profiles" on public.profiles
      for update using (public.is_admin());
  end if;
end;
$$;

-- ──────────────────────────────────────────────────────────
-- 11. Seed tools table
-- ──────────────────────────────────────────────────────────

insert into public.tools (id, name, description) values
  ('lp_portal', 'LP Portal',  'Investor-facing fund updates and reporting'),
  ('sourcing',  'NEV Signal', 'Deal sourcing and signal tracking'),
  ('admin',     'Admin',      'User and access management')
on conflict (id) do nothing;
