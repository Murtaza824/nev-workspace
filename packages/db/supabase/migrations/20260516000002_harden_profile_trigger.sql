-- Harden profile trigger: always assign 'lp' role, never trust invite metadata
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
    'lp'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
