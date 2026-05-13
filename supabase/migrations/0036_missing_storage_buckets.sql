-- 0036_missing_storage_buckets.sql
-- Drei Buckets als Migration nachgezogen, die bisher nur manuell im
-- Dashboard angelegt wurden. Audit P2-4/P2-5/P2-6.
-- Idempotent.

-- =================================================================
-- 1) avatars · public read · self-write per RLS
-- =================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

drop policy if exists "avatars self write" on storage.objects;
create policy "avatars self write"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars self update" on storage.objects;
create policy "avatars self update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars self delete" on storage.objects;
create policy "avatars self delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =================================================================
-- 2) message-attachments · privater Bucket, Read fuer Sender + Empfaenger
-- =================================================================
insert into storage.buckets (id, name, public)
values ('message-attachments', 'message-attachments', false)
on conflict (id) do update set public = false;

drop policy if exists "message-attachments self write" on storage.objects;
create policy "message-attachments self write"
  on storage.objects for insert
  with check (
    bucket_id = 'message-attachments'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Read: eigene Uploads + Admin/Manager
drop policy if exists "message-attachments read" on storage.objects;
create policy "message-attachments read"
  on storage.objects for select
  using (
    bucket_id = 'message-attachments'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from profiles
        where profiles.id = auth.uid()
          and profiles.role in ('admin', 'manager')
      )
    )
  );

drop policy if exists "message-attachments self delete" on storage.objects;
create policy "message-attachments self delete"
  on storage.objects for delete
  using (
    bucket_id = 'message-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =================================================================
-- 3) zoe-downloads · Bucket-Creation nachgezogen
--    Policies sind bereits in 0003_storage_policies.sql definiert
-- =================================================================
insert into storage.buckets (id, name, public)
values ('zoe-downloads', 'zoe-downloads', false)
on conflict (id) do update set public = false;

notify pgrst, 'reload schema';
