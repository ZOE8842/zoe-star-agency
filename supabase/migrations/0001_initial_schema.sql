-- ====================================================================
-- ZOE Star Agency Webapp · Phase 1 · Initial Schema
-- Source-of-Truth: 23_Webapp_Product_Architecture.md §5
-- ====================================================================

-- ENUMS ----------------------------------------------------------------

create type user_role as enum ('creator', 'manager', 'admin');
create type user_status as enum ('active', 'inactive', 'pending');

create type event_category as enum ('live', 'battle', 'ranking', 'special', 'announcement');
create type event_status as enum ('draft', 'open', 'closed', 'archived');
create type event_signup_status as enum ('signed', 'confirmed', 'rejected', 'no_show');

create type slot_status as enum ('planned', 'went_live', 'missed', 'cancelled');

create type download_category as enum ('logo', 'image', 'video', 'template', 'pdf', 'guide', 'other');

create type message_category as enum ('event', 'traffic', 'contract', 'payout', 'rule', 'support', 'general');
create type message_recipient_group as enum ('all_creators', 'my_creators', 'custom');

create type notification_type as enum ('message', 'event', 'slot', 'academy', 'reminder', 'badge', 'support');
create type notification_status as enum ('unread', 'read', 'dismissed');

create type academy_progress_status as enum ('started', 'completed', 'quiz_passed', 'quiz_failed');

create type badge_tier as enum ('bronze', 'silver', 'gold', 'platinum');

create type support_category as enum ('payout', 'contract', 'event', 'tech', 'traffic', 'general');
create type support_status as enum ('open', 'in_progress', 'resolved', 'closed');

-- PROFILES -------------------------------------------------------------

create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text,
  tiktok_username text not null unique,
  display_name    text not null,
  role            user_role not null default 'creator',
  manager_id      uuid references profiles(id),
  status          user_status not null default 'pending',
  language        text not null default 'de',
  country         text,
  avatar_url      text,
  bio             text,
  joined_at       timestamptz not null default now(),
  last_active_at  timestamptz,
  metadata        jsonb default '{}'::jsonb
);

create index profiles_role_idx on profiles(role);
create index profiles_manager_id_idx on profiles(manager_id);
create index profiles_tiktok_username_idx on profiles(tiktok_username);

-- INVITES --------------------------------------------------------------

create table invites (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  created_by     uuid not null references profiles(id),
  created_at     timestamptz not null default now(),
  expires_at     timestamptz,
  used_at        timestamptz,
  used_by        uuid references profiles(id),
  intended_role  user_role not null default 'creator'
);

create index invites_code_idx on invites(code);
create index invites_used_at_idx on invites(used_at);

-- EVENTS ---------------------------------------------------------------

create table events (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text,
  category         event_category not null default 'live',
  start_at         timestamptz not null,
  end_at           timestamptz,
  max_participants int,
  status           event_status not null default 'draft',
  cover_image_url  text,
  created_by       uuid not null references profiles(id),
  created_at       timestamptz not null default now()
);

create index events_status_idx on events(status);
create index events_start_at_idx on events(start_at);

create table event_signups (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  creator_id  uuid not null references profiles(id) on delete cascade,
  status      event_signup_status not null default 'signed',
  signed_at   timestamptz not null default now(),
  note        text,
  unique (event_id, creator_id)
);

create index event_signups_creator_idx on event_signups(creator_id);

-- SLOTS ----------------------------------------------------------------

create table slots (
  id                uuid primary key default gen_random_uuid(),
  creator_id        uuid not null references profiles(id) on delete cascade,
  start_at          timestamptz not null,
  duration_minutes  int not null,
  tiktok_username   text,
  status            slot_status not null default 'planned',
  notes             text,
  created_at        timestamptz not null default now(),
  completed_at      timestamptz
);

create index slots_creator_idx on slots(creator_id);
create index slots_start_at_idx on slots(start_at);

-- DOWNLOADS ------------------------------------------------------------

create table downloads (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  description       text,
  category          download_category not null default 'other',
  file_url          text not null,
  file_size         bigint,
  file_type         text,
  tags              text[] default '{}',
  visible_to_role   user_role,
  uploaded_by       uuid not null references profiles(id),
  uploaded_at       timestamptz not null default now()
);

create index downloads_category_idx on downloads(category);

-- MESSAGES + READS -----------------------------------------------------

create table messages (
  id                uuid primary key default gen_random_uuid(),
  sender_id         uuid not null references profiles(id),
  recipient_id      uuid references profiles(id),
  recipient_group   message_recipient_group,
  subject           text not null,
  body              text not null,
  category          message_category not null default 'general',
  requires_ack      boolean not null default false,
  sent_at           timestamptz not null default now(),
  parent_id         uuid references messages(id) on delete set null,
  check (recipient_id is not null or recipient_group is not null)
);

create index messages_recipient_id_idx on messages(recipient_id);
create index messages_sender_id_idx on messages(sender_id);

create table message_reads (
  id                uuid primary key default gen_random_uuid(),
  message_id        uuid not null references messages(id) on delete cascade,
  reader_id         uuid not null references profiles(id) on delete cascade,
  read_at           timestamptz not null default now(),
  acknowledged_at   timestamptz,
  unique (message_id, reader_id)
);

-- NOTIFICATIONS --------------------------------------------------------

create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  type        notification_type not null,
  title       text not null,
  body        text,
  link        text,
  status      notification_status not null default 'unread',
  channel     text[] not null default '{in_app}',
  created_at  timestamptz not null default now(),
  read_at     timestamptz
);

create index notifications_user_status_idx on notifications(user_id, status);

-- ACADEMY --------------------------------------------------------------

create table academy_modules (
  id              uuid primary key default gen_random_uuid(),
  phase_number    int not null,
  title           text not null,
  description     text,
  order_index     int not null default 0,
  prerequisite_id uuid references academy_modules(id),
  created_at      timestamptz not null default now()
);

create table academy_lessons (
  id               uuid primary key default gen_random_uuid(),
  module_id        uuid not null references academy_modules(id) on delete cascade,
  title            text not null,
  content_md       text,
  video_url        text,
  order_index      int not null default 0,
  duration_minutes int
);

create table academy_quiz_questions (
  id               uuid primary key default gen_random_uuid(),
  module_id        uuid not null references academy_modules(id) on delete cascade,
  question         text not null,
  question_type    text not null default 'single',
  options          jsonb not null default '[]'::jsonb,
  correct_answers  jsonb not null default '[]'::jsonb,
  points           int not null default 1,
  order_index      int not null default 0
);

create table academy_progress (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  module_id      uuid not null references academy_modules(id) on delete cascade,
  lesson_id      uuid references academy_lessons(id) on delete set null,
  status         academy_progress_status not null default 'started',
  quiz_score     int,
  quiz_attempts  int not null default 0,
  started_at     timestamptz not null default now(),
  completed_at   timestamptz,
  unique (user_id, lesson_id)
);

-- BADGES ---------------------------------------------------------------

create table badges (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  title           text not null,
  description     text,
  icon_url        text,
  tier            badge_tier not null default 'bronze',
  auto_award_rule jsonb
);

create table user_badges (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  badge_id    uuid not null references badges(id) on delete cascade,
  awarded_at  timestamptz not null default now(),
  awarded_by  uuid references profiles(id),
  note        text,
  unique (user_id, badge_id)
);

-- SUPPORT --------------------------------------------------------------

create table support_tickets (
  id           uuid primary key default gen_random_uuid(),
  creator_id   uuid not null references profiles(id) on delete cascade,
  category     support_category not null default 'general',
  subject      text not null,
  body         text not null,
  status       support_status not null default 'open',
  assigned_to  uuid references profiles(id),
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);

create index support_tickets_status_idx on support_tickets(status);
create index support_tickets_creator_idx on support_tickets(creator_id);

create table support_messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references support_tickets(id) on delete cascade,
  sender_id   uuid not null references profiles(id),
  body        text not null,
  attachments text[] default '{}',
  sent_at     timestamptz not null default now()
);

-- ANALYTICS ------------------------------------------------------------

create table analytics_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete set null,
  event_type   text not null,
  metadata     jsonb default '{}'::jsonb,
  occurred_at  timestamptz not null default now()
);

create index analytics_events_user_idx on analytics_events(user_id);
create index analytics_events_type_idx on analytics_events(event_type);

-- HELPER FUNCTIONS -----------------------------------------------------

-- Invite einlösen + Profile-Insert in einer Transaktion
-- Wird von Signup-Page über supabase.rpc() aufgerufen.
create or replace function redeem_invite_and_create_profile(
  invite_code_input text,
  tiktok_username_input text,
  display_name_input text,
  country_input text,
  language_input text
) returns void
language plpgsql
security definer
as $$
declare
  invite_record record;
  current_user_id uuid;
begin
  current_user_id := auth.uid();
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Invite prüfen
  select * into invite_record
  from invites
  where code = invite_code_input
    and used_at is null
    and (expires_at is null or expires_at > now())
  for update;

  if invite_record is null then
    raise exception 'Ungültiger oder bereits genutzter Invite-Code';
  end if;

  -- Profile anlegen
  insert into profiles (id, email, tiktok_username, display_name, role, status, country, language)
  values (
    current_user_id,
    (select email from auth.users where id = current_user_id),
    tiktok_username_input,
    display_name_input,
    invite_record.intended_role,
    'active',
    country_input,
    language_input
  );

  -- Invite als used markieren
  update invites
  set used_at = now(), used_by = current_user_id
  where id = invite_record.id;
end;
$$;

-- Helper: Aktuelle User-Rolle aus profiles holen
create or replace function current_user_role() returns user_role
language sql security definer stable
as $$
  select role from profiles where id = auth.uid();
$$;

-- ALL DONE -------------------------------------------------------------
