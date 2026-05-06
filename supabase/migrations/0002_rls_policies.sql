-- ====================================================================
-- ZOE Star Agency · RLS Policies
-- Aktiviert RLS auf allen relevanten Tabellen + Policies pro Rolle.
-- ====================================================================

-- PROFILES -------------------------------------------------------------
alter table profiles enable row level security;

create policy "users see own profile + public fields of others"
  on profiles for select
  using (
    auth.uid() = id
    or current_user_role() in ('manager', 'admin')
  );

create policy "users update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "admin all profiles"
  on profiles for all
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- INVITES --------------------------------------------------------------
alter table invites enable row level security;

create policy "admin manages invites"
  on invites for all
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- EVENTS ---------------------------------------------------------------
alter table events enable row level security;

create policy "authenticated reads events"
  on events for select
  using (auth.role() = 'authenticated');

create policy "admin manages events"
  on events for all
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- EVENT_SIGNUPS --------------------------------------------------------
alter table event_signups enable row level security;

create policy "creator sees own signups"
  on event_signups for select
  using (creator_id = auth.uid());

create policy "manager sees own creators signups"
  on event_signups for select
  using (
    creator_id in (select id from profiles where manager_id = auth.uid())
  );

create policy "admin sees all signups"
  on event_signups for all
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

create policy "creator inserts own signup"
  on event_signups for insert
  with check (creator_id = auth.uid());

create policy "creator deletes own signup"
  on event_signups for delete
  using (creator_id = auth.uid());

-- SLOTS ----------------------------------------------------------------
alter table slots enable row level security;

create policy "creator sees own slots"
  on slots for select
  using (creator_id = auth.uid());

create policy "manager sees own creator slots"
  on slots for select
  using (
    creator_id in (select id from profiles where manager_id = auth.uid())
  );

create policy "admin all slots"
  on slots for all
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

create policy "creator manages own slots"
  on slots for all
  using (creator_id = auth.uid())
  with check (creator_id = auth.uid());

-- DOWNLOADS ------------------------------------------------------------
alter table downloads enable row level security;

create policy "authenticated reads downloads"
  on downloads for select
  using (
    auth.role() = 'authenticated'
    and (visible_to_role is null or visible_to_role::text = 'all' or visible_to_role = current_user_role())
  );

create policy "admin manages downloads"
  on downloads for all
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- MESSAGES + READS -----------------------------------------------------
alter table messages enable row level security;
alter table message_reads enable row level security;

create policy "user sees relevant messages"
  on messages for select
  using (
    sender_id = auth.uid()
    or recipient_id = auth.uid()
    or recipient_group = 'all_creators'
    or (recipient_group = 'my_creators'
        and sender_id in (select manager_id from profiles where id = auth.uid()))
  );

create policy "manager admin sends messages"
  on messages for insert
  with check (current_user_role() in ('manager', 'admin'));

create policy "user reads marks own"
  on message_reads for all
  using (reader_id = auth.uid())
  with check (reader_id = auth.uid());

-- NOTIFICATIONS --------------------------------------------------------
alter table notifications enable row level security;

create policy "user own notifications"
  on notifications for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "admin sees all notifications"
  on notifications for select
  using (current_user_role() = 'admin');

-- ACADEMY --------------------------------------------------------------
alter table academy_modules enable row level security;
alter table academy_lessons enable row level security;
alter table academy_quiz_questions enable row level security;
alter table academy_progress enable row level security;

create policy "authenticated reads modules"
  on academy_modules for select using (auth.role() = 'authenticated');
create policy "admin manages modules"
  on academy_modules for all
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

create policy "authenticated reads lessons"
  on academy_lessons for select using (auth.role() = 'authenticated');
create policy "admin manages lessons"
  on academy_lessons for all
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

create policy "authenticated reads quiz"
  on academy_quiz_questions for select using (auth.role() = 'authenticated');
create policy "admin manages quiz"
  on academy_quiz_questions for all
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

create policy "user own progress"
  on academy_progress for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "manager sees own creator progress"
  on academy_progress for select
  using (user_id in (select id from profiles where manager_id = auth.uid()));

create policy "admin sees all progress"
  on academy_progress for select
  using (current_user_role() = 'admin');

-- BADGES ---------------------------------------------------------------
alter table badges enable row level security;
alter table user_badges enable row level security;

create policy "authenticated reads badges"
  on badges for select using (auth.role() = 'authenticated');
create policy "admin manages badges"
  on badges for all
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

create policy "user own badges"
  on user_badges for select
  using (user_id = auth.uid());
create policy "all read awarded badges"
  on user_badges for select using (auth.role() = 'authenticated');
create policy "admin awards badges"
  on user_badges for all
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- SUPPORT --------------------------------------------------------------
alter table support_tickets enable row level security;
alter table support_messages enable row level security;

create policy "creator own tickets"
  on support_tickets for select
  using (creator_id = auth.uid());
create policy "creator creates ticket"
  on support_tickets for insert
  with check (creator_id = auth.uid());
create policy "admin manager all tickets"
  on support_tickets for all
  using (current_user_role() in ('admin', 'manager'))
  with check (current_user_role() in ('admin', 'manager'));

create policy "ticket participants read messages"
  on support_messages for select
  using (
    ticket_id in (
      select id from support_tickets where creator_id = auth.uid()
    )
    or current_user_role() in ('admin', 'manager')
  );
create policy "ticket participants send messages"
  on support_messages for insert
  with check (
    sender_id = auth.uid()
    and (
      ticket_id in (select id from support_tickets where creator_id = auth.uid())
      or current_user_role() in ('admin', 'manager')
    )
  );

-- ANALYTICS ------------------------------------------------------------
alter table analytics_events enable row level security;

create policy "user inserts own events"
  on analytics_events for insert
  with check (user_id = auth.uid() or user_id is null);
create policy "admin sees all events"
  on analytics_events for select
  using (current_user_role() = 'admin');
