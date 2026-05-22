-- Storage bucket RLS policies for memos and update-pdfs
-- Buckets are created manually in the Supabase dashboard (public = true)

-- memos: investment memo PDFs per portfolio company
create policy "admins can upload memos"
  on storage.objects for insert
  with check (bucket_id = 'memos' and public.is_admin());

create policy "authenticated users read memos"
  on storage.objects for select
  using (bucket_id = 'memos' and auth.role() = 'authenticated');

create policy "admins can delete memos"
  on storage.objects for delete
  using (bucket_id = 'memos' and public.is_admin());

-- update-pdfs: PDF attachments on fund updates
create policy "admins can upload update-pdfs"
  on storage.objects for insert
  with check (bucket_id = 'update-pdfs' and public.is_admin());

create policy "authenticated users read update-pdfs"
  on storage.objects for select
  using (bucket_id = 'update-pdfs' and auth.role() = 'authenticated');

create policy "admins can delete update-pdfs"
  on storage.objects for delete
  using (bucket_id = 'update-pdfs' and public.is_admin());
