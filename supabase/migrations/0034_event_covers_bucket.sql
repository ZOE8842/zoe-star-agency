-- 0034_event_covers_bucket.sql
-- Public Bucket fuer Event-Cover-Bilder (Agency-Events + TikTok-Events).
-- Upload nur via API-Route + Service-Role; oeffentliche Read-URL fuer
-- alle Creator (Cover wird im Portal/Events-Feed angezeigt).
--
-- Idempotent: ON CONFLICT DO NOTHING + DROP POLICY IF EXISTS.

insert into storage.buckets (id, name, public)
values ('event-covers', 'event-covers', true)
on conflict (id) do update set public = true;

-- Public Read: jeder darf Cover sehen (Portal zeigt Events fuer alle).
drop policy if exists "event_covers_public_read" on storage.objects;
create policy "event_covers_public_read"
on storage.objects for select
to public
using (bucket_id = 'event-covers');

-- Write/Update/Delete nur via Service-Role-Key (API-Route hinter
-- requireAdmin). Keine direkte Policy fuer authenticated Users —
-- bucket bleibt fuer Clients write-protected.
drop policy if exists "event_covers_admin_insert" on storage.objects;
drop policy if exists "event_covers_admin_update" on storage.objects;
drop policy if exists "event_covers_admin_delete" on storage.objects;
