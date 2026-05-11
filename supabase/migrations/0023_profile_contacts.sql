-- ZOE Star Agency — Profile-Erweiterung · Kontakt-Felder + Geburtstag
-- Telegram + WhatsApp-Number + Instagram-Username + Birthday (Tag+Monat)
-- DSGVO: KEIN Jahr, nur Tag + Monat (Reminder-Use).
-- Idempotent.

alter table profiles
  add column if not exists instagram_username text,
  add column if not exists whatsapp_number text,
  add column if not exists birthday_day smallint,
  add column if not exists birthday_month smallint;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_instagram_username_check') then
    alter table profiles add constraint profiles_instagram_username_check
      check (instagram_username is null or length(instagram_username) <= 64);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_whatsapp_number_check') then
    alter table profiles add constraint profiles_whatsapp_number_check
      check (whatsapp_number is null or whatsapp_number ~* '^\+?[0-9 ()-]{4,32}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_birthday_day_check') then
    alter table profiles add constraint profiles_birthday_day_check
      check (birthday_day is null or (birthday_day between 1 and 31));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_birthday_month_check') then
    alter table profiles add constraint profiles_birthday_month_check
      check (birthday_month is null or (birthday_month between 1 and 12));
  end if;
end$$;

notify pgrst, 'reload schema';
