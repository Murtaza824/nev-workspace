-- ============================================================
-- Phase 4: Signal detail support
--   1. snoozed_until on sourcing_signals
--   2. sourcing_signal_notes table + RLS
-- ============================================================

-- 1. Add snooze expiry to signals
alter table public.sourcing_signals
  add column if not exists snoozed_until timestamptz;

-- 2. Notes table
create table if not exists public.sourcing_signal_notes (
  id         uuid        primary key default gen_random_uuid(),
  signal_id  uuid        not null references public.sourcing_signals(id) on delete cascade,
  author_id  uuid        not null references public.profiles(id) on delete cascade,
  body       text        not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sourcing_signal_notes_signal_idx
  on public.sourcing_signal_notes (signal_id, created_at);

-- RLS
alter table public.sourcing_signal_notes enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'sourcing_signal_notes'
    and policyname = 'sourcing users read notes'
  ) then
    create policy "sourcing users read notes" on public.sourcing_signal_notes
      for select using (
        exists (
          select 1 from public.profiles
          where id = auth.uid() and 'sourcing' = any(app_access) and status = 'active'
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'sourcing_signal_notes'
    and policyname = 'sourcing users create notes'
  ) then
    create policy "sourcing users create notes" on public.sourcing_signal_notes
      for insert with check (
        author_id = auth.uid()
        and exists (
          select 1 from public.profiles
          where id = auth.uid() and 'sourcing' = any(app_access) and status = 'active'
        )
      );
  end if;
end $$;
