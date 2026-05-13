-- K4 · content_reviews RLS
-- Defense-in-Depth: bisher hat nur die UI profile_id=me gefiltert.
-- Wenn jemals ein API-Endpoint die Tabelle ohne Filter exponiert,
-- konnte jeder authenticated User alle Reviews lesen (inkl. private
-- Analyse-Scores + Storage-Pfade).
--
-- Service-Role-Worker (Cron + Server-Actions) ist von RLS exempt,
-- bleibt also funktional.
--
-- Idempotent.

alter table content_reviews enable row level security;

-- Own-Read: Creator sieht eigene Reviews
drop policy if exists cr_own_read on content_reviews;
create policy cr_own_read on content_reviews for select
  using (profile_id = auth.uid());

-- Own-Insert: Creator legt eigene Anfragen an
drop policy if exists cr_own_insert on content_reviews;
create policy cr_own_insert on content_reviews for insert
  with check (profile_id = auth.uid());

-- Own-Update: Creator darf eigene Anfragen kommentieren / abbrechen
-- (UI nutzt das aktuell nur fuer manual_note; reviewed_at + ai_score
-- werden vom Service-Role-Worker geschrieben, der RLS umgeht)
drop policy if exists cr_own_update on content_reviews;
create policy cr_own_update on content_reviews for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Manager-Scoping: Manager sieht Reviews seiner Creator
drop policy if exists cr_manager_read on content_reviews;
create policy cr_manager_read on content_reviews for select
  using (
    exists (
      select 1
      from profiles p
      where p.id = content_reviews.profile_id
        and p.manager_id = auth.uid()
    )
  );

-- Admin: full CRUD
drop policy if exists cr_admin_all on content_reviews;
create policy cr_admin_all on content_reviews for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

notify pgrst, 'reload schema';
