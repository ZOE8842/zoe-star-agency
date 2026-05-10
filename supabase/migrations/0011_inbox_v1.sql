-- ZOE Star Agency — Inbox V1 + Activity-Feed Foundation
-- Block C der Plattform-V2-Etappe.
-- Idempotent.
-- V1-Scope: message_reactions + activity_feed.
-- V2-Foundation (Tabellen schon angelegt, UI spaeter):
-- conversations + conversation_members.

-- 1) message_reactions — Likes/Emoji auf bestehende messages
create table if not exists message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  emoji text not null check (length(emoji) between 1 and 8),
  created_at timestamptz not null default now(),
  unique(message_id, profile_id, emoji)
);

create index if not exists mr_message_idx on message_reactions (message_id);
create index if not exists mr_profile_idx on message_reactions (profile_id);

alter table message_reactions enable row level security;

-- Eigene + alle reactions zu Nachrichten lesen die der User selbst sieht
drop policy if exists mr_read on message_reactions;
create policy mr_read on message_reactions for select
  using (
    exists (
      select 1 from messages m
      where m.id = message_reactions.message_id
        and (m.recipient_id = auth.uid()
          or m.sender_id = auth.uid()
          or m.recipient_group = 'all_creators')
    )
  );

drop policy if exists mr_insert on message_reactions;
create policy mr_insert on message_reactions for insert
  with check (profile_id = auth.uid());

drop policy if exists mr_delete on message_reactions;
create policy mr_delete on message_reactions for delete
  using (profile_id = auth.uid());

drop policy if exists mr_admin_all on message_reactions;
create policy mr_admin_all on message_reactions for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));


-- 2) activity_feed — System-Posts (Creator live, Match-Anfrage, neue Lektion)
create table if not exists activity_feed (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in (
    'creator_live','match_call','event_started','academy_lesson',
    'tiktok_push_selected','agency_news','creator_joined'
  )),
  actor_id uuid references profiles(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  visibility text not null default 'all_creators'
    check (visibility in ('all_creators','admin_only','specific')),
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists af_created_idx on activity_feed (created_at desc);
create index if not exists af_actor_idx on activity_feed (actor_id);

alter table activity_feed enable row level security;

drop policy if exists af_read_creators on activity_feed;
create policy af_read_creators on activity_feed for select
  using (
    visibility = 'all_creators'
    and (expires_at is null or expires_at > now())
  );

drop policy if exists af_admin_all on activity_feed;
create policy af_admin_all on activity_feed for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));


-- 3) V2-FOUNDATION: conversations + conversation_members
-- (Tabellen werden V1 noch nicht in der UI genutzt — kommen mit V2)
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('dm','group','channel')),
  title text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  last_message_at timestamptz
);

create index if not exists conv_last_message_idx on conversations (last_message_at desc nulls last);

alter table conversations enable row level security;

drop policy if exists conv_member_read on conversations;
create policy conv_member_read on conversations for select
  using (
    exists (
      select 1 from conversation_members cm
      where cm.conversation_id = conversations.id and cm.profile_id = auth.uid()
    )
  );

drop policy if exists conv_admin_all on conversations;
create policy conv_admin_all on conversations for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));


create table if not exists conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member','observer')),
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  muted boolean not null default false,
  unique(conversation_id, profile_id)
);

create index if not exists cm_profile_idx on conversation_members (profile_id);
create index if not exists cm_conv_idx on conversation_members (conversation_id);

alter table conversation_members enable row level security;

drop policy if exists cm_self_read on conversation_members;
create policy cm_self_read on conversation_members for select
  using (profile_id = auth.uid()
    or exists (
      select 1 from conversation_members me
      where me.conversation_id = conversation_members.conversation_id
        and me.profile_id = auth.uid()
    )
  );

drop policy if exists cm_admin_all on conversation_members;
create policy cm_admin_all on conversation_members for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));


-- 4) messages erweitern um Conversation-Foreign-Key + Type
alter table messages
  add column if not exists conversation_id uuid references conversations(id) on delete set null,
  add column if not exists message_type text default 'text'
    check (message_type in ('text','system','match_call','event','attachment')),
  add column if not exists attachments jsonb default '[]'::jsonb;

create index if not exists msg_conv_idx on messages (conversation_id, sent_at desc);
