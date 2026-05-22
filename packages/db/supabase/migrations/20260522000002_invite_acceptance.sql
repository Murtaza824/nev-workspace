-- ============================================================
-- Invite acceptance helper.
-- Adds a security-definer RPC that the auth callback can call to
-- apply an accepted invitation's role/app_access to the new profile.
-- Called with the authenticated user's session (no service-role key
-- needed in apps/auth) since the function runs as the DB owner.
-- ============================================================

create or replace function public.accept_invitation(
  p_user_id   uuid,
  p_user_email text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.invitations;
begin
  -- Find the most recent non-expired, unaccepted invitation for this email
  select * into v_inv
  from public.invitations
  where email = lower(p_user_email)
    and accepted_at is null
    and expires_at > now()
  order by invited_at desc
  limit 1;

  if v_inv.id is null then
    return;
  end if;

  -- Apply role, app_access, and provenance to the profile
  update public.profiles
  set
    role       = v_inv.role,
    app_access = v_inv.app_access,
    status     = 'active',
    invited_by = v_inv.invited_by,
    invited_at = v_inv.invited_at
  where id = p_user_id;

  -- Mark invitation accepted
  update public.invitations
  set accepted_at = now()
  where id = v_inv.id;
end;
$$;

revoke all on function public.accept_invitation(uuid, text) from public;
grant execute on function public.accept_invitation(uuid, text) to authenticated;
