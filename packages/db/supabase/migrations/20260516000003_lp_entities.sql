-- LP entities: represents an LP commitment holder.
-- A single entity (e.g. "Acme Capital") may have multiple team members,
-- all of whom share the same commitment_amount and see identical fund data.
--
-- Relationship: lp_entities 1 → N profiles
-- Dashboard logic: prefer entity.commitment_amount when entity_id is set.

create table public.lp_entities (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  commitment_amount numeric,
  committed_at    date,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Link profiles to their entity (nullable — admins have no entity)
alter table public.profiles
  add column entity_id uuid references public.lp_entities(id) on delete set null;

-- RLS
alter table public.lp_entities enable row level security;

-- LP can read the entity they belong to
create policy "lp reads own entity" on public.lp_entities for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.entity_id = lp_entities.id
    )
  );

-- Admins read and write all entities
create policy "admin reads all entities" on public.lp_entities for select
  using (public.is_admin());

create policy "admin writes entities" on public.lp_entities for all
  using (public.is_admin());
