-- Migration 0051 · creator_applications
-- Public Creator-Anfrage-Formular (loest TikTok-App-Bewerbungslink ab).
-- Insert nur via API-Route (service_role) damit Rate-Limit + Validation greift.
-- Read/Update nur Admin.

create table if not exists public.creator_applications (
  id                  uuid primary key default gen_random_uuid(),
  tiktok_username     text not null,
  tiktok_profile_url  text,
  tiktok_display_name text,
  contact_method      text not null check (contact_method in ('tiktok','telegram')),
  telegram_username   text,
  language            text,
  region              text,
  message             text,
  consent_privacy     boolean not null default false,
  status              text not null default 'new'
    check (status in ('new','reviewed','contacted','rejected','onboarded')),
  admin_note          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists ca_status_created_idx
  on public.creator_applications (status, created_at desc);
create index if not exists ca_created_at_idx
  on public.creator_applications (created_at desc);
create index if not exists ca_tiktok_username_idx
  on public.creator_applications (lower(tiktok_username));

-- updated_at-Trigger
create or replace function public.creator_applications_touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists creator_applications_touch on public.creator_applications;
create trigger creator_applications_touch
  before update on public.creator_applications
  for each row execute function public.creator_applications_touch_updated_at();

alter table public.creator_applications enable row level security;

-- Admin read + update (Status / admin_note)
drop policy if exists ca_admin_read on public.creator_applications;
create policy ca_admin_read on public.creator_applications
  for select to authenticated
  using (public.current_user_role() = 'admin');

drop policy if exists ca_admin_update on public.creator_applications;
create policy ca_admin_update on public.creator_applications
  for update to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- Insert ausschliesslich via service_role (API /api/creator-applications).
-- Anon/Authenticated duerfen NICHT direkt inserten.
revoke insert on public.creator_applications from anon, authenticated;
grant  insert on public.creator_applications to service_role;

notify pgrst, 'reload schema';
