-- Migration 0059 · creator_backstage_meta
--
-- Phase C₃ (minimal) gemäß 03_Umsatz_Reiter/00_Workflow.md §6.5.
-- Stammdaten + Status pro Creator. KEINE Monats-Historisierung —
-- UPSERT bei jedem Scrape, kein Versioning, kein force-Flag.
-- Handle-keyed analog crm/clpm/cmm/cdm.
--
-- WICHTIG · R17 (System-Trennung):
--   Diese Tabelle enthält NUR Felder, die direkt im Creator-Karte-DOM
--   stehen (Backstage-Detail-Page Initial-Load). KEINE Compliance-/
--   Akademie-/Verstoß-Detail-Pages. Diese gehören zu späteren Phasen
--   bzw. eigenen Tabellen.
--
-- WICHTIG · Sync-Library-Regel:
--   UPSERT muss COALESCE(new.field, existing.field) für Stamm-Spalten
--   verwenden, damit temporär fehlende DOM-Werte nicht echte Daten
--   überschreiben. Nur last_live_at_observed und Snapshot-Counts werden
--   bedingungslos überschrieben.
--
-- RLS: NUR Admin (cbm_admin_read).

create table if not exists public.creator_backstage_meta (
  tiktok_handle_normalized    text primary key,
  profile_id                  uuid references public.profiles(id) on delete set null,
  tiktok_username             text not null,

  -- Identität / Vertrag
  agent_email                 text,
  management_period_start     date,
  management_period_end       date,
  group_name                  text,                       -- NULL wenn "Nicht in einer Gruppe"
  invitation_type             text,                       -- 'Regulär' / 'Premium' / 'Elite'
  backstage_language          text,
  bio                         text,

  -- Status
  is_new_creator              boolean,
  graduation_status_label     text,                       -- raw Backstage-Text
  last_live_at_observed       timestamptz,                -- absolut, aus relativem "Vor X" abgeleitet

  -- Snapshot-Felder (Stand letzter Sync)
  follower_count_snapshot     int,
  videos_count_snapshot       int,
  likes_count_snapshot        int,

  source                      text not null default 'backstage_creator_card',
  source_schema_version       text not null,
  synced_at                   timestamptz not null default now(),
  raw_snapshot                jsonb
);

-- Defensive CHECKs
alter table public.creator_backstage_meta
  drop constraint if exists cbm_nonneg_snapshots,
  add  constraint           cbm_nonneg_snapshots
       check (
         (follower_count_snapshot is null or follower_count_snapshot >= 0)
         and (videos_count_snapshot is null or videos_count_snapshot >= 0)
         and (likes_count_snapshot  is null or likes_count_snapshot  >= 0)
       );

alter table public.creator_backstage_meta
  drop constraint if exists cbm_management_window,
  add  constraint           cbm_management_window
       check (
         management_period_start is null
         or management_period_end is null
         or management_period_start <= management_period_end
       );

alter table public.creator_backstage_meta
  drop constraint if exists cbm_invitation_type_allowed,
  add  constraint           cbm_invitation_type_allowed
       check (
         invitation_type is null
         or invitation_type in ('Regulär', 'Premium', 'Elite')
       );

-- Indizes
create index if not exists cbm_profile_idx
  on public.creator_backstage_meta (profile_id)
  where profile_id is not null;

create index if not exists cbm_new_creator_idx
  on public.creator_backstage_meta (is_new_creator)
  where is_new_creator is true;

create index if not exists cbm_invitation_type_idx
  on public.creator_backstage_meta (invitation_type)
  where invitation_type is not null;

create index if not exists cbm_last_live_idx
  on public.creator_backstage_meta (last_live_at_observed desc nulls last);

-- Auto-Link-Trigger (analog crm/clpm)
create or replace function public.cbm_auto_link_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.profile_id is null and new.tiktok_handle_normalized is not null then
    select p.id into new.profile_id
      from public.profiles p
     where p.tiktok_handle_normalized = new.tiktok_handle_normalized
     limit 1;
  end if;
  return new;
end;
$$;
revoke execute on function public.cbm_auto_link_profile() from public, anon;

drop trigger if exists cbm_auto_link_profile_trg on public.creator_backstage_meta;
create trigger cbm_auto_link_profile_trg
  before insert or update on public.creator_backstage_meta
  for each row execute function public.cbm_auto_link_profile();

-- Profiles-Backreferenz-Trigger (analog profiles_link_existing_crm/clpm)
create or replace function public.profiles_link_existing_cbm()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.tiktok_handle_normalized is not null
     and (
       tg_op = 'INSERT'
       or old.tiktok_handle_normalized is null
       or old.tiktok_handle_normalized <> new.tiktok_handle_normalized
     )
  then
    update public.creator_backstage_meta
       set profile_id = new.id
     where tiktok_handle_normalized = new.tiktok_handle_normalized
       and (profile_id is null or profile_id <> new.id);
  end if;
  return new;
end;
$$;
revoke execute on function public.profiles_link_existing_cbm() from public, anon;

drop trigger if exists profiles_link_existing_cbm_trg on public.profiles;
create trigger profiles_link_existing_cbm_trg
  after insert or update on public.profiles
  for each row execute function public.profiles_link_existing_cbm();

-- RLS
alter table public.creator_backstage_meta enable row level security;

drop policy if exists cbm_admin_read on public.creator_backstage_meta;
create policy cbm_admin_read on public.creator_backstage_meta
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'::user_role
    )
  );

notify pgrst, 'reload schema';
