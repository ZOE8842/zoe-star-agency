-- 0039_audit_logs.sql
-- Audit-Log Tabelle. Nur Admin darf lesen. Inserts via Service-Role.
-- Idempotent.

create table if not exists audit_logs (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  actor_id    uuid references profiles(id) on delete set null,
  actor_role  text,
  action      text not null,          -- z.B. "event.create"
  target_table text,                  -- z.B. "events"
  target_id   text,                   -- z.B. event-UUID oder member-pair
  payload     jsonb not null default '{}'::jsonb,
  ok          boolean not null default true,
  error_msg   text
);

create index if not exists audit_logs_created_idx on audit_logs (created_at desc);
create index if not exists audit_logs_actor_idx on audit_logs (actor_id, created_at desc);
create index if not exists audit_logs_action_idx on audit_logs (action, created_at desc);
create index if not exists audit_logs_target_idx on audit_logs (target_table, target_id);

alter table audit_logs enable row level security;

drop policy if exists audit_admin_read on audit_logs;
create policy audit_admin_read on audit_logs for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

-- Inserts laufen ausschliesslich via Service-Role (lib/audit/log.ts).
-- Keine INSERT-Policy fuer authenticated → RLS lehnt automatisch ab.

notify pgrst, 'reload schema';
