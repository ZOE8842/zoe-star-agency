-- Phase D · Gruppen
-- Messages muessen entweder recipient_id, recipient_group ODER conversation_id haben.
-- Original 0001 verlangte recipient_id OR recipient_group — das blockiert
-- Gruppen-Messages, die nur via conversation_id gezielt werden.
-- Idempotent.

alter table messages drop constraint if exists messages_check;
alter table messages drop constraint if exists messages_target_check;

alter table messages
  add constraint messages_target_check
  check (
    recipient_id is not null
    or recipient_group is not null
    or conversation_id is not null
  );

-- Index fuer Conversation-Reads (last-message-at + conversation_id Lookups)
create index if not exists messages_conversation_sent_idx
  on messages (conversation_id, sent_at desc)
  where conversation_id is not null;

notify pgrst, 'reload schema';
