-- ZOE Star Agency · Migration 0043 · Phase-4 Security-Pass
-- 1) academy_creator_xp View: SECURITY DEFINER → SECURITY INVOKER
--    (View bypassed bisher RLS auf academy_lesson_reads/quiz_attempts/challenge_submissions)
-- 2) 5 SECURITY DEFINER Functions: REVOKE EXECUTE FROM PUBLIC, anon
--    - Trigger-Functions behalten authenticated (Trigger fires unter user-context)
--    - REST-callable Functions sind ab jetzt nur fuer authenticated nutzbar
-- 3) 4 Functions: search_path explicit setzen (function_search_path_mutable Lints)
--
-- Idempotent (REVOKE / ALTER FUNCTION sind idempotent).

-- ============================================================
-- 1) View → SECURITY INVOKER (bewertet RLS des aufrufenden Users)
-- ============================================================
alter view public.academy_creator_xp set (security_invoker = on);

-- ============================================================
-- 2a) REST-callable Functions: anon raus, authenticated behalten
-- ============================================================
revoke execute on function public.current_user_role()                  from public, anon;
revoke execute on function public.is_conversation_member(uuid, uuid)   from public, anon;
revoke execute on function public.redeem_invite_and_create_profile(text, text, text, text, text) from public, anon;

-- ============================================================
-- 2b) Trigger-Functions: anon + public raus
-- (authenticated bleibt, weil Trigger im User-Kontext feuert)
-- ============================================================
revoke execute on function public.prevent_self_role_escalation()              from public, anon;
revoke execute on function public.reset_showcase_approval_on_creator_edit()   from public, anon;

-- ============================================================
-- 3) search_path-Hardening (function_search_path_mutable Lint)
-- ============================================================
alter function public.redeem_invite_and_create_profile(text, text, text, text, text) set search_path = public, pg_temp;
alter function public.reset_showcase_approval_on_creator_edit()                       set search_path = public, pg_temp;
alter function public.set_match_requests_updated_at()                                 set search_path = public, pg_temp;
alter function public.publish_drafts_touch()                                          set search_path = public, pg_temp;

notify pgrst, 'reload schema';
