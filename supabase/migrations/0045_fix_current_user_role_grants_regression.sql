-- ZOE Star Agency · Migration 0045 · HOTFIX (Phase-4-Regression)
--
-- ROOT CAUSE:
-- Migration 0043 hat `REVOKE EXECUTE ON FUNCTION public.current_user_role()
-- FROM PUBLIC, anon` angewandt — mit der Annahme, dass die Function nur via
-- REST direkt aufgerufen wird. ABER: current_user_role() wird in 24 RLS-Policies
-- referenziert (profiles, events, downloads, notifications, support_tickets,
-- academy_*, analytics_events, slots, user_badges, media_assets, platform_*,
-- publish_*, invites). Jeder DB-Read der eine dieser Policies trifft fuehrt
-- bei anon zu "permission denied for function current_user_role" (Error 42501).
--
-- SYMPTOM:
-- /portal-Dashboard rendert bei Creator-Login die neuen Phase-5-Bloecke nicht
-- vollstaendig — der Cookie-User-Client trifft beim refresh-Cycle eventuell
-- noch anon-Phase und failt dort. Plus: alle Public-Pages die profiles-Reads
-- machen (Creator-Profile, Showcase) brechen ab.
--
-- Gleiches gilt fuer is_conversation_member(uuid, uuid) — wird in
-- conversation_members und conversations RLS-Policies aufgerufen (Migration
-- 0038). Auch hier muss EXECUTE fuer alle Roles bleiben.
--
-- redeem_invite_and_create_profile + 2 Trigger-Functions sind NICHT betroffen
-- (werden via direkter rpc-Aufruf bzw. Trigger gerufen, nicht in Policies).
--
-- FIX:
-- EXECUTE-Rechte fuer current_user_role + is_conversation_member wieder
-- vollstaendig grant'en. Security-Hardening durch SET search_path bleibt.
--
-- Idempotent.

grant execute on function public.current_user_role()                 to public, anon, authenticated;
grant execute on function public.is_conversation_member(uuid, uuid)  to public, anon, authenticated;

notify pgrst, 'reload schema';
