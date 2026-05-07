-- ZOE Star Agency — Showcase-Creators
-- Member-Upload + Admin-Approve-System für Public-Site Featured Creators.
-- Idempotent. Run via Supabase Dashboard SQL Editor.

-- 1) TABLE
create table if not exists showcase_creators (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles(id) on delete cascade,
  display_name text not null check (length(display_name) between 1 and 80),
  category text check (length(category) <= 60),
  showcase_image text,
  tiktok_url text check (tiktok_url is null or tiktok_url ~* '^https?://'),
  instagram_url text check (instagram_url is null or instagram_url ~* '^https?://'),
  is_approved boolean not null default false,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references profiles(id)
);

create index if not exists showcase_approved_featured_sort_idx
  on showcase_creators (is_approved, is_featured, sort_order);

create index if not exists showcase_profile_idx
  on showcase_creators (profile_id);

-- 2) RESET-APPROVAL-TRIGGER bei Creator-Edit
-- Wenn Creator (kein Admin) seine Showcase ändert, fliegt approval raus
-- → Admin muss neu freigeben. Schutz vor versteckten Edits.
create or replace function reset_showcase_approval_on_creator_edit()
returns trigger
language plpgsql
security definer
as $$
declare
  is_admin_caller boolean;
begin
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  ) into is_admin_caller;

  if is_admin_caller then
    -- Admin: keine Änderung an approval-flags
    return new;
  end if;

  -- Creator: reset approval-flags
  new.is_approved := false;
  new.is_featured := false;
  new.approved_at := null;
  new.approved_by := null;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists showcase_reset_approval_trg on showcase_creators;
create trigger showcase_reset_approval_trg
  before update on showcase_creators
  for each row
  execute function reset_showcase_approval_on_creator_edit();

-- 3) RLS aktivieren
alter table showcase_creators enable row level security;

-- 4) RLS POLICIES

-- Public read: nur approved + featured (für Homepage)
drop policy if exists showcase_public_read on showcase_creators;
create policy showcase_public_read
  on showcase_creators for select
  using (is_approved = true and is_featured = true);

-- Own read: creator sieht eigene row immer (auch pending)
drop policy if exists showcase_own_read on showcase_creators;
create policy showcase_own_read
  on showcase_creators for select
  using (profile_id = auth.uid());

-- Own insert/update: creator schreibt nur eigene row
drop policy if exists showcase_own_insert on showcase_creators;
create policy showcase_own_insert
  on showcase_creators for insert
  with check (profile_id = auth.uid());

drop policy if exists showcase_own_update on showcase_creators;
create policy showcase_own_update
  on showcase_creators for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Admin: full manage (approve, feature, sort, delete)
drop policy if exists showcase_admin_read on showcase_creators;
create policy showcase_admin_read
  on showcase_creators for select
  using (exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));

drop policy if exists showcase_admin_update on showcase_creators;
create policy showcase_admin_update
  on showcase_creators for update
  using (exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));

drop policy if exists showcase_admin_delete on showcase_creators;
create policy showcase_admin_delete
  on showcase_creators for delete
  using (exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));

-- 5) STORAGE-BUCKET fuer Showcase-Images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'showcase-images',
  'showcase-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Public read fuer alle showcase-images
drop policy if exists "Public read showcase-images" on storage.objects;
create policy "Public read showcase-images"
  on storage.objects for select
  using (bucket_id = 'showcase-images');

-- Authenticated upload (eigene folder via path)
drop policy if exists "Owner upload showcase-images" on storage.objects;
create policy "Owner upload showcase-images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'showcase-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Owner update showcase-images" on storage.objects;
create policy "Owner update showcase-images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'showcase-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Owner delete showcase-images" on storage.objects;
create policy "Owner delete showcase-images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'showcase-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
