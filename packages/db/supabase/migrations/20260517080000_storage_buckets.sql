-- Storage buckets for admin PDF uploads
-- memos: investment memos attached to portfolio companies
-- update-pdfs: PDFs attached to GP updates

insert into storage.buckets (id, name, public)
values
  ('memos', 'memos', true),
  ('update-pdfs', 'update-pdfs', true)
on conflict (id) do nothing;

-- Storage RLS policies for memos bucket
drop policy if exists "admins can upload memos" on storage.objects;
create policy "admins can upload memos"
  on storage.objects for insert
  with check (
    bucket_id = 'memos'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "admins can update memos" on storage.objects;
create policy "admins can update memos"
  on storage.objects for update
  using (
    bucket_id = 'memos'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "authenticated can read memos" on storage.objects;
create policy "authenticated can read memos"
  on storage.objects for select
  using (
    bucket_id = 'memos'
    and auth.role() = 'authenticated'
  );

-- Storage RLS policies for update-pdfs bucket
drop policy if exists "admins can upload update-pdfs" on storage.objects;
create policy "admins can upload update-pdfs"
  on storage.objects for insert
  with check (
    bucket_id = 'update-pdfs'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "admins can update update-pdfs" on storage.objects;
create policy "admins can update update-pdfs"
  on storage.objects for update
  using (
    bucket_id = 'update-pdfs'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "authenticated can read update-pdfs" on storage.objects;
create policy "authenticated can read update-pdfs"
  on storage.objects for select
  using (
    bucket_id = 'update-pdfs'
    and auth.role() = 'authenticated'
  );
