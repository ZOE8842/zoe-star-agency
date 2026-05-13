-- 0038_conversation_rls_hardening.sql
-- Audit P2-3. cm_self_read aus 0011 hat EXISTS-Subquery auf conversation_members
-- aus der eigenen Policy → RLS-Rekursionsgefahr unter Last + bei JOIN-Pfaden.
-- Wir ersetzen sie durch eine SECURITY DEFINER-Funktion + non-recursive Policy.
-- Idempotent.

-- Security-Definer-Helper: prueft Membership ohne RLS-Recursion.
-- Laeuft mit Owner-Privilegien, daher kein Policy-Check innerhalb.
create or replace function public.is_conversation_member(conv_id uuid, p_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = conv_id and profile_id = p_id
  );
$$;

revoke all on function public.is_conversation_member(uuid, uuid) from public;
grant execute on function public.is_conversation_member(uuid, uuid) to authenticated;

-- Alte rekursive Policy ablösen.
drop policy if exists cm_self_read on conversation_members;
drop policy if exists cm_member_select on conversation_members;

-- Eigene Member-Rows + alle Member-Rows der eigenen Conversations.
create policy cm_member_select on conversation_members for select
  using (
    profile_id = auth.uid()
    or public.is_conversation_member(conversation_id, auth.uid())
  );

-- Conversations-Policy gleich modernisieren (war auch EXISTS-basiert).
drop policy if exists conv_member_read on conversations;
create policy conv_member_read on conversations for select
  using (
    public.is_conversation_member(id, auth.uid())
  );

notify pgrst, 'reload schema';
