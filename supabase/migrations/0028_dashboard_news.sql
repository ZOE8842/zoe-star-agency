-- Dashboard-News + Birthday V1
-- Idempotent.

alter table profiles
  add column if not exists birthday_day smallint,
  add column if not exists birthday_month smallint;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_birthday_day_check') then
    alter table profiles add constraint profiles_birthday_day_check
      check (birthday_day is null or birthday_day between 1 and 31);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_birthday_month_check') then
    alter table profiles add constraint profiles_birthday_month_check
      check (birthday_month is null or birthday_month between 1 and 12);
  end if;
end$$;

create index if not exists profiles_birthday_idx
  on profiles (birthday_month, birthday_day);

create table if not exists dashboard_news (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('birthday_today','birthday_tomorrow','creator_joined','event','system')),
  title text not null,
  body text,
  profile_id uuid references profiles(id) on delete cascade,
  tiktok_username text,
  tiktok_url text,
  dedupe_key text unique,
  visible_from timestamptz not null default now(),
  visible_until timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists dashboard_news_visible_from_idx
  on dashboard_news (visible_from desc);

create index if not exists dashboard_news_visible_until_idx
  on dashboard_news (visible_until);

alter table dashboard_news enable row level security;

drop policy if exists dn_read_all on dashboard_news;
create policy dn_read_all on dashboard_news
  for select
  using (auth.role() = 'authenticated');

drop policy if exists dn_admin_all on dashboard_news;
create policy dn_admin_all on dashboard_news
  for all
  using (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin','manager')
    )
  )
  with check (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin','manager')
    )
  );

notify pgrst, 'reload schema';
