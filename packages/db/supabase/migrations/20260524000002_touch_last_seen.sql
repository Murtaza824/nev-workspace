-- RPC called by middleware to record when a user was last active.
-- SECURITY DEFINER so it can write last_seen_at without needing a broad
-- UPDATE policy on profiles for the authenticated role.
-- set search_path prevents search_path injection.

create or replace function public.touch_last_seen()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set last_seen_at = now()
  where id = auth.uid();
$$;
