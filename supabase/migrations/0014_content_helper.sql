-- ZOE Star Agency — Content Helfer Premium
-- Block E: Upload + Job-Queue + KI-Foundation + Cost-Logging.
-- Idempotent.

-- 1) content_reviews erweitern (Tabelle existiert seit 0009)
alter table content_reviews
  add column if not exists kind text default 'link',
  add column if not exists source_url text,
  add column if not exists ai_provider text,
  add column if not exists ai_model text,
  add column if not exists cost_usd numeric(10,4) default 0,
  add column if not exists processing_started_at timestamptz,
  add column if not exists error_message text,
  add column if not exists priority integer default 0,
  add column if not exists summary jsonb default '{}'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'content_reviews_kind_check') then
    alter table content_reviews add constraint content_reviews_kind_check
      check (kind in ('video_file','video_link','image','profile'));
  end if;
end$$;

-- erweiterte Status-Werte (queued + failed + processing)
do $$
begin
  -- Alte Check-Constraint droppen wenn existiert
  if exists (select 1 from pg_constraint where conname = 'content_reviews_status_check') then
    alter table content_reviews drop constraint content_reviews_status_check;
  end if;
  alter table content_reviews add constraint content_reviews_status_check
    check (status in ('submitted','queued','processing','done','failed','reviewed','in_review'));
end$$;

create index if not exists cr_status_idx on content_reviews (status, created_at desc);


-- 2) Storage-Bucket fuer Content-Uploads (privat, max 200MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'creator-content',
  'creator-content',
  false,
  209715200,
  ARRAY[
    'image/jpeg','image/png','image/webp','image/gif',
    'video/mp4','video/quicktime','video/webm','video/x-m4v'
  ]
)
on conflict (id) do nothing;

drop policy if exists "Owner read creator-content" on storage.objects;
create policy "Owner read creator-content"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'creator-content'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Owner upload creator-content" on storage.objects;
create policy "Owner upload creator-content"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'creator-content'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Owner delete creator-content" on storage.objects;
create policy "Owner delete creator-content"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'creator-content'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Admin all creator-content" on storage.objects;
create policy "Admin all creator-content"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'creator-content'
    and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );
