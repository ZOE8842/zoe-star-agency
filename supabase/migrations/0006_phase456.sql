-- ZOE Star Agency — Phase 4/5/6 Combined Migration
-- Idempotent. Run via Supabase Dashboard SQL Editor.

-- 1) MESSAGES.ATTACHMENTS
alter table messages add column if not exists attachments text[] default '{}';

-- 2) CREATOR_NOTES
create table if not exists creator_notes (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles(id) on delete cascade,
  author_id uuid not null references profiles(id),
  body text not null check (length(body) between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create index if not exists creator_notes_creator_id_idx on creator_notes(creator_id);
create index if not exists creator_notes_created_at_idx on creator_notes(created_at desc);
alter table creator_notes enable row level security;

drop policy if exists creator_notes_read on creator_notes;
create policy creator_notes_read
on creator_notes for select
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
      and profiles.role in ('manager','admin')
  )
);

drop policy if exists creator_notes_insert on creator_notes;
create policy creator_notes_insert
on creator_notes for insert
with check (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
      and profiles.role in ('manager','admin')
  )
);

drop policy if exists creator_notes_update_own on creator_notes;
create policy creator_notes_update_own
on creator_notes for update
using (author_id = auth.uid());

drop policy if exists creator_notes_delete_own_or_admin on creator_notes;
create policy creator_notes_delete_own_or_admin
on creator_notes for delete
using (
  author_id = auth.uid()
  or exists (
    select 1 from profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

-- 3) CAMPAIGN_STATUS ENUM
do $$
begin
  if not exists (select 1 from pg_type where typname = 'campaign_status') then
    create type campaign_status as enum ('draft','active','paused','completed','archived');
  end if;
end $$;

-- 4) CAMPAIGNS
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 200),
  brand text,
  status campaign_status not null default 'draft',
  brief text,
  mood_url text,
  deliverables text,
  start_at timestamptz,
  end_at timestamptz,
  created_by uuid not null references profiles(id),
  manager_id uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create index if not exists campaigns_manager_id_idx on campaigns(manager_id);
create index if not exists campaigns_status_idx on campaigns(status);
create index if not exists campaigns_created_at_idx on campaigns(created_at desc);

-- 5) CAMPAIGN_CREATORS (junction)
create table if not exists campaign_creators (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  creator_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique(campaign_id, creator_id)
);
create index if not exists campaign_creators_campaign_id_idx on campaign_creators(campaign_id);
create index if not exists campaign_creators_creator_id_idx on campaign_creators(creator_id);

alter table campaigns enable row level security;
alter table campaign_creators enable row level security;

-- 6) CAMPAIGNS POLICIES
drop policy if exists campaigns_read on campaigns;
create policy campaigns_read
on campaigns for select
using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and (
        p.role = 'admin'
        or (p.role = 'manager' and campaigns.manager_id = p.id)
      )
  )
  or exists (
    select 1 from campaign_creators cc
    where cc.campaign_id = campaigns.id
      and cc.creator_id = auth.uid()
  )
);

drop policy if exists campaigns_write on campaigns;
create policy campaigns_write
on campaigns for all
using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and (
        p.role = 'admin'
        or (p.role = 'manager' and campaigns.manager_id = p.id)
      )
  )
)
with check (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.role in ('manager','admin')
  )
);

-- 7) CAMPAIGN_CREATORS POLICIES
drop policy if exists campaign_creators_read on campaign_creators;
create policy campaign_creators_read
on campaign_creators for select
using (
  creator_id = auth.uid()
  or exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.role in ('manager','admin')
  )
);

drop policy if exists campaign_creators_write on campaign_creators;
create policy campaign_creators_write
on campaign_creators for all
using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.role in ('manager','admin')
  )
)
with check (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.role in ('manager','admin')
  )
);
