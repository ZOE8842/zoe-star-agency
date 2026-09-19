-- Migration 0064 · Supabase Security-Advisor Befunde 2026-09-20
--
-- 1) v_creator_incentive_summary / v_creator_incentive_compute
--    Views laufen in Postgres standardmaessig mit den Rechten des Erstellers
--    (postgres) und umgehen damit die RLS der Basistabellen. Migration 0060
--    hat ausdruecklich "RLS erbt sich aus den Basis-Tabellen" beabsichtigt —
--    das gilt erst mit security_invoker. Die Admin-Seiten lesen die Views
--    entweder per Service-Role (bypass) oder als eingeloggter Admin, fuer den
--    die *_admin_read-Policies der Basistabellen greifen. Kein Verhaltens-
--    unterschied fuer die App, aber kein RLS-Bypass mehr fuer andere Rollen.
--
-- 2) SECURITY-DEFINER-Funktionen waren fuer anon per /rest/v1/rpc aufrufbar
--    (Default-Grant an PUBLIC). Keine Public-Route der App nutzt den anon-
--    Client fuer Tabellenzugriffe (alle Public-Seiten laufen ueber Service-
--    Role), daher braucht anon diese Funktionen nicht. Grant bleibt fuer
--    authenticated (RLS-Policies rufen current_user_role / is_conversation_
--    member) und service_role.
--    Hinweis: revoke ... from anon allein wirkt nicht, solange PUBLIC den
--    Grant haelt — deshalb revoke from public UND anon, dann gezielt grant.
--
-- pg_trgm-Verschiebung liegt bewusst in 0065: die Extension gehoert
-- supabase_admin, ein Fehler dort darf diese beiden Haertungen nicht
-- zurueckrollen.
--
-- Reversibel: alter view ... reset (security_invoker); grant execute ... to public.

alter view public.v_creator_incentive_summary set (security_invoker = true);
alter view public.v_creator_incentive_compute set (security_invoker = true);

revoke execute on function public.current_user_role() from public, anon;
grant  execute on function public.current_user_role() to authenticated, service_role;

revoke execute on function public.is_conversation_member(uuid, uuid) from public, anon;
grant  execute on function public.is_conversation_member(uuid, uuid) to authenticated, service_role;

revoke execute on function public.creator_applications_touch_updated_at() from public, anon;
grant  execute on function public.creator_applications_touch_updated_at() to authenticated, service_role;

notify pgrst, 'reload schema';
