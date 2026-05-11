-- ZOE Star Agency · Interest-Status fuer Showcase + Kooperationen
-- + Admin-Edit-Felder brand_safe + public_note auf showcase_creators
--
-- Idempotent · sicher bei Re-Run.

-- ============================================================
-- 1) profiles · Interest-Status fuer Showcase + Kooperation
-- ============================================================

alter table profiles
  add column if not exists showcase_interest_status text default 'pending',
  add column if not exists showcase_interest_decided_at timestamptz,
  add column if not exists showcase_interest_note text,
  add column if not exists cooperation_interest_status text default 'pending',
  add column if not exists cooperation_interest_decided_at timestamptz,
  add column if not exists cooperation_interest_note text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_showcase_interest_check') then
    alter table profiles add constraint profiles_showcase_interest_check
      check (showcase_interest_status in ('pending','accepted','declined'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_cooperation_interest_check') then
    alter table profiles add constraint profiles_cooperation_interest_check
      check (cooperation_interest_status in ('pending','accepted','declined'));
  end if;
end$$;

-- Migration der bestehenden Daten:
-- Wer schon allow_website_showcase=true gesetzt hat → status='accepted'
update profiles
set
  showcase_interest_status = 'accepted',
  showcase_interest_decided_at = coalesce(showcase_interest_decided_at, allow_website_showcase_confirmed_at, joined_at, created_at, now())
where allow_website_showcase = true
  and (showcase_interest_status is null or showcase_interest_status = 'pending');

update profiles
set
  cooperation_interest_status = 'accepted',
  cooperation_interest_decided_at = coalesce(cooperation_interest_decided_at, allow_partner_cooperations_confirmed_at, joined_at, created_at, now())
where allow_partner_cooperations = true
  and (cooperation_interest_status is null or cooperation_interest_status = 'pending');

-- ============================================================
-- 2) showcase_creators · Admin-Edit-Felder
-- ============================================================

alter table showcase_creators
  add column if not exists brand_safe boolean default false,
  add column if not exists public_note text;

-- ============================================================
-- 3) RLS-Policies (read = via existing profile-policies)
-- ============================================================

-- Keine neuen Policies noetig: profiles + showcase_creators haben
-- bestehende RLS. Service-Role bypasst sowieso, App-Server liest
-- via Service-Role-Client fuer Public-Layer.

notify pgrst, 'reload schema';
