-- ZOE Star Agency — Showcase + Consent + Follow-Status
-- Block A der Plattform-V2-Etappe.
-- Idempotent.

-- 1) showcase_creators erweitern
alter table showcase_creators
  add column if not exists showcase_images jsonb not null default '[]'::jsonb,
  add column if not exists birthday_day smallint,
  add column if not exists birthday_month smallint;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'showcase_birthday_day_check') then
    alter table showcase_creators add constraint showcase_birthday_day_check
      check (birthday_day is null or (birthday_day between 1 and 31));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'showcase_birthday_month_check') then
    alter table showcase_creators add constraint showcase_birthday_month_check
      check (birthday_month is null or (birthday_month between 1 and 12));
  end if;
end$$;

-- Migration: bestehende showcase_image-URL in jsonb-array verschieben
update showcase_creators
   set showcase_images = jsonb_build_array(
         jsonb_build_object('url', showcase_image, 'type', 'image', 'position', 1)
       )
 where showcase_image is not null
   and (showcase_images = '[]'::jsonb or showcase_images is null);

-- 2) profiles erweitern um Follow-Status + Consent-Confirmed-Flags
alter table profiles
  add column if not exists followed_zoe_instagram boolean not null default false,
  add column if not exists followed_zoe_tiktok boolean not null default false,
  add column if not exists followed_zoe_telegram boolean not null default false,
  add column if not exists follow_prompt_dismissed_at timestamptz,
  add column if not exists allow_website_showcase_confirmed boolean not null default false,
  add column if not exists allow_website_showcase_confirmed_at timestamptz,
  add column if not exists allow_partner_cooperations_confirmed boolean not null default false,
  add column if not exists allow_partner_cooperations_confirmed_at timestamptz;

-- 3) consent_tokens — One-Time-Tokens fuer Email-Bestaetigung
create table if not exists consent_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  consent_type text not null check (consent_type in ('showcase','brand_cooperation')),
  token text unique not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ct_profile_type_idx on consent_tokens (profile_id, consent_type);
create index if not exists ct_token_idx on consent_tokens (token);

alter table consent_tokens enable row level security;

drop policy if exists ct_own_read on consent_tokens;
create policy ct_own_read on consent_tokens for select
  using (profile_id = auth.uid());

drop policy if exists ct_admin_all on consent_tokens;
create policy ct_admin_all on consent_tokens for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- Insert/Update/Delete fuer non-admin via Service-Role-API only.

-- 4) WICHTIGE LOGIK-AENDERUNG showcase_creators public_read
-- Public-Site darf nur Cards anzeigen, deren OWNER allow_website_
-- showcase_confirmed=true hat (nicht nur is_approved+is_featured).
-- Die alte public-read-policy bleibt aber bestehen weil
-- showcase_creators.is_featured weiterhin der Admin-Approval-Flag ist.
-- Die Confirm-Logic ist in der App-Schicht: Admin gibt erst frei wenn
-- profiles.allow_website_showcase_confirmed=true.

-- 5) Index fuer Birthday-Reminder
create index if not exists showcase_birthday_idx
  on showcase_creators (birthday_month, birthday_day)
  where birthday_month is not null and birthday_day is not null;
