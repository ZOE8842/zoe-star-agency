-- Migration 0050 · admin_analytics_events
-- Portal-Aktivitaets-Tracking fuer Admin-Dashboard.
-- Speichert technische Events (page_view, login, dashboard_open) ohne IP/PII.
-- Insert nur service_role (Server-API), Read nur Admin.

create table if not exists public.admin_analytics_events (
  id          uuid primary key default gen_random_uuid(),
  event_type  text not null,
  user_id     uuid references auth.users(id) on delete set null,
  profile_id  uuid references public.profiles(id) on delete set null,
  role        text,
  path        text,
  session_id  text,
  created_at  timestamptz not null default now()
);

create index if not exists aae_created_at_idx
  on public.admin_analytics_events (created_at desc);
create index if not exists aae_event_type_idx
  on public.admin_analytics_events (event_type);
create index if not exists aae_user_id_idx
  on public.admin_analytics_events (user_id) where user_id is not null;
create index if not exists aae_profile_id_idx
  on public.admin_analytics_events (profile_id) where profile_id is not null;
create index if not exists aae_session_id_idx
  on public.admin_analytics_events (session_id) where session_id is not null;

alter table public.admin_analytics_events enable row level security;

-- Admin-only read
drop policy if exists aae_admin_read on public.admin_analytics_events;
create policy aae_admin_read on public.admin_analytics_events
  for select to authenticated
  using (public.current_user_role() = 'admin');

-- Insert nur ueber service_role (API-Route mit SUPABASE_SERVICE_ROLE_KEY).
-- Anon/Authenticated duerfen NICHT direkt inserten.
revoke insert on public.admin_analytics_events from anon, authenticated;
grant  insert on public.admin_analytics_events to service_role;

notify pgrst, 'reload schema';
