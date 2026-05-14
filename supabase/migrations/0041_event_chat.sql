-- 0041_event_chat.sql
-- V2-6: Event-Chat. Pro Event optional eine Conversation (type='group')
-- verlinkt. Nur Admin/Manager/confirmed-Signups sind Member.
-- Idempotent.

alter table events
  add column if not exists chat_conversation_id uuid references conversations(id) on delete set null;

create index if not exists events_chat_conversation_idx
  on events (chat_conversation_id);

notify pgrst, 'reload schema';
