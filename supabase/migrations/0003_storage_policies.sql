-- Storage-RLS-Policies fuer zoe-downloads-Bucket
-- Authenticated users lesen, Admins schreiben

-- Read: alle authentifizierten User
create policy "authenticated read downloads"
  on storage.objects for select
  using (
    bucket_id = 'zoe-downloads'
    and auth.role() = 'authenticated'
  );

-- Insert: nur Admins
create policy "admins insert downloads"
  on storage.objects for insert
  with check (
    bucket_id = 'zoe-downloads'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Update: nur Admins (Metadata/Replace)
create policy "admins update downloads"
  on storage.objects for update
  using (
    bucket_id = 'zoe-downloads'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Delete: nur Admins
create policy "admins delete downloads"
  on storage.objects for delete
  using (
    bucket_id = 'zoe-downloads'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
