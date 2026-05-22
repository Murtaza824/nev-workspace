-- Add entity_role to profiles so LPs can tag team members as member or admin
alter table public.profiles
  add column if not exists entity_role text
  check (entity_role in ('member', 'admin'))
  default 'member';
