-- K5 · dashboard_news Manager-Scoping
-- 0028 hatte: dn_admin_all fuer Admin+Manager → Manager konnte fremde
-- Creator-News inserten/loeschen (Fake-News-Risk).
--
-- Neu:
-- - Admin: full CRUD (alle News)
-- - Manager: nur News fuer eigene Creator (profile_id ist Creator des Managers)
--   ODER ohne profile_id (System-Wide News wie Events)
-- - Service-Role (Cron, Server-Actions) bleibt RLS-exempt
--
-- Idempotent.

drop policy if exists dn_admin_all on dashboard_news;

-- Admin: alles
create policy dn_admin_all on dashboard_news for all
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

-- Manager: nur eigene Creator (profile_id mit manager_id=auth.uid())
-- oder global-News ohne spezifische profile_id (z.B. event/system).
drop policy if exists dn_manager_scope on dashboard_news;
create policy dn_manager_scope on dashboard_news for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'manager'
    )
    and (
      profile_id is null
      or exists (
        select 1 from profiles
        where profiles.id = dashboard_news.profile_id
          and profiles.manager_id = auth.uid()
      )
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'manager'
    )
    and (
      profile_id is null
      or exists (
        select 1 from profiles
        where profiles.id = dashboard_news.profile_id
          and profiles.manager_id = auth.uid()
      )
    )
  );

-- dn_read_all (alle authenticated) bleibt unveraendert — Sichtbarkeit
-- ist absichtlich breit, weil News sowieso fuer alle gedacht sind.

notify pgrst, 'reload schema';
