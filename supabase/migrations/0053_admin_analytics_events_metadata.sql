-- Migration 0053 · admin_analytics_events Marketing-Metadata
-- DSGVO-minimal:
--   * keine IP
--   * user_agent gekappt 256 chars, KEIN Fingerprint-Hashing
--   * referrer gekappt 512 chars
--   * utm_* gekappt 128 chars
--   * locale gekappt 16 chars
--   * device_type abgeleitet (mobile | tablet | desktop | unknown)
--   * event_source markiert woher das Event kam (client | server)

alter table public.admin_analytics_events
  add column if not exists locale       text,
  add column if not exists referrer     text,
  add column if not exists utm_source   text,
  add column if not exists utm_medium   text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content  text,
  add column if not exists utm_term     text,
  add column if not exists user_agent   text,
  add column if not exists device_type  text,
  add column if not exists event_source text;

create index if not exists aae_locale_idx
  on public.admin_analytics_events (locale)       where locale is not null;
create index if not exists aae_utm_source_idx
  on public.admin_analytics_events (utm_source)   where utm_source is not null;
create index if not exists aae_device_type_idx
  on public.admin_analytics_events (device_type)  where device_type is not null;
create index if not exists aae_event_source_idx
  on public.admin_analytics_events (event_source) where event_source is not null;

comment on column public.admin_analytics_events.locale       is 'kurzform de|en|fr|tr|pt|ar etc., gekappt 16 chars';
comment on column public.admin_analytics_events.referrer     is 'document.referrer oder Server-Referer-Header, gekappt 512 chars';
comment on column public.admin_analytics_events.utm_source   is 'Marketing-UTM, gekappt 128 chars';
comment on column public.admin_analytics_events.user_agent   is 'User-Agent gekappt 256 chars, kein Fingerprinting';
comment on column public.admin_analytics_events.device_type  is 'mobile | tablet | desktop | unknown';
comment on column public.admin_analytics_events.event_source is 'client | server';

notify pgrst, 'reload schema';
