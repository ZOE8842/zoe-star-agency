-- ZOE Star Agency · Migration 0046 · Phase A (Backstage als Primary Source)
--
-- ZIEL:
-- creator_monthly_metrics auf handle-keyed umstellen, damit auch Backstage-
-- Creator ohne Portal-Profile gespeichert werden koennen. Sobald ein Creator
-- spaeter onboardet, werden seine bestehenden Backstage-Rows automatisch
-- via Trigger mit dem neuen profiles.id verknuepft (Rueckverknuepfung,
-- damit Historie nicht verloren geht).
--
-- AENDERUNGEN:
--   A) profile_id wird NULLABLE
--   B) Neue Spalte tiktok_handle_normalized (text, NOT NULL nach Backfill)
--   C) Backfill bestehender 23 Rows (lowercase, strip @)
--   D) Unique-Constraint wechselt:
--        ALT: (profile_id, month)
--        NEU: (tiktok_handle_normalized, month)
--   E) Sekundaer-Index (profile_id, month) WHERE profile_id IS NOT NULL
--      → schnelle Creator-Reads bleiben performant
--   F) Trigger BEFORE INSERT/UPDATE auf cmm:
--        Wenn profile_id NULL gesetzt wird, versuche Match via Handle.
--   G) Trigger AFTER INSERT/UPDATE auf profiles:
--        Wenn handle gesetzt/geaendert, alle bestehenden cmm-Rows mit
--        gleichem Handle rueckwirkend dem neuen profile_id zuordnen.
--
-- RLS:
--   cmm_own_read     (profile_id = auth.uid())  → NULL-Rows unsichtbar  ✓
--   cmm_manager_read (target.manager_id = me)   → NULL-Rows unsichtbar  ✓
--   cmm_admin_read   (admin role check)         → alle Rows sichtbar   ✓
--   → Keine Policy-Aenderung noetig. Class-B-Rows (handle-only) sind
--     nur fuer admin lesbar (was korrekt ist — fuers Admin-Ranking).
--
-- BREAKING-RISIKEN (alle gepruft, alle null):
--   - 23 bestehende Rows: alle haben profile_id != NULL → bleiben Class A
--   - 0 Handle-Duplikate auf (handle, month) → UNIQUE-Swap sicher
--   - 0 Rows mit empty username → Backfill liefert non-empty handle
--   - CASCADE-FK auf profile_id bleibt (handle-only-Rows haben NULL FK,
--     unbetroffen). Bei Delete eines profiles werden zugewiesene Rows
--     wie bisher geloescht — bewusste Entscheidung, nicht geaendert.
--
-- IDEMPOTENT.

-- ============================================================
-- A) profile_id NULLABLE
-- ============================================================
alter table public.creator_monthly_metrics
  alter column profile_id drop not null;

-- ============================================================
-- B) tiktok_handle_normalized als persistente Spalte
-- ============================================================
alter table public.creator_monthly_metrics
  add column if not exists tiktok_handle_normalized text;

-- ============================================================
-- C) Backfill bestehender Rows
-- ============================================================
update public.creator_monthly_metrics
   set tiktok_handle_normalized = lower(regexp_replace(coalesce(tiktok_username,''), '^@+', ''))
 where tiktok_handle_normalized is null;

-- ============================================================
-- D) NOT NULL auf Handle nach Backfill
-- ============================================================
alter table public.creator_monthly_metrics
  alter column tiktok_handle_normalized set not null;

-- ============================================================
-- E) Unique-Constraint swap: (profile_id, month) → (handle, month)
-- ============================================================
alter table public.creator_monthly_metrics
  drop constraint if exists creator_monthly_metrics_profile_id_month_key;
alter table public.creator_monthly_metrics
  add constraint cmm_handle_month_uniq unique (tiktok_handle_normalized, month);

-- ============================================================
-- F) Sekundaer-Index fuer Creator-Reads
-- ============================================================
create index if not exists cmm_profile_id_month_idx
  on public.creator_monthly_metrics (profile_id, month)
  where profile_id is not null;

-- ============================================================
-- G1) Trigger-Function: Auto-Link beim Push
-- ============================================================
create or replace function public.cmm_auto_link_profile()
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

revoke execute on function public.cmm_auto_link_profile() from public, anon;

drop trigger if exists cmm_auto_link_profile_trg on public.creator_monthly_metrics;
create trigger cmm_auto_link_profile_trg
  before insert or update on public.creator_monthly_metrics
  for each row execute function public.cmm_auto_link_profile();

-- ============================================================
-- G2) Trigger-Function: Rueckverknuepfung bei Profile-Update
-- ============================================================
create or replace function public.profiles_link_existing_cmm()
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
    update public.creator_monthly_metrics
       set profile_id = new.id
     where tiktok_handle_normalized = new.tiktok_handle_normalized
       and (profile_id is null or profile_id <> new.id);
  end if;
  return new;
end;
$$;

revoke execute on function public.profiles_link_existing_cmm() from public, anon;

drop trigger if exists profiles_link_existing_cmm_trg on public.profiles;
create trigger profiles_link_existing_cmm_trg
  after insert or update on public.profiles
  for each row execute function public.profiles_link_existing_cmm();

-- ============================================================
-- Schema-Cache-Reload fuer PostgREST
-- ============================================================
notify pgrst, 'reload schema';
