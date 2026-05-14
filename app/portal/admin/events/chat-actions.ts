"use server";

// V2-6 Event-Chat Server-Actions.
//
// Spec (Nesip):
//   Q1 = b: Members = Admin + Manager + confirmed event_signups
//   Q2 = a: Manuell per Admin-Button (kein Auto-Create)
//   Q3 = a: Nach Event-Ende bleibt Chat offen
//   Q4 = a: Link auf Event-Detail (Admin + Creator-Sicht)

import { revalidatePath } from "next/cache";
import { createClient as createSrClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { writeAudit } from "@/lib/audit/log";

function admin() {
  return createSrClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function loadEventChatMembers(sb: ReturnType<typeof admin>, eventId: string): Promise<string[]> {
  const [{ data: staff }, { data: signups }] = await Promise.all([
    sb.from("profiles").select("id").in("role", ["admin", "manager"]).eq("status", "active"),
    sb.from("event_signups").select("creator_id").eq("event_id", eventId).eq("status", "confirmed"),
  ]);
  const ids = new Set<string>();
  for (const p of staff ?? []) ids.add(p.id);
  for (const s of signups ?? []) ids.add(s.creator_id);
  return Array.from(ids);
}

export async function createEventChat(
  eventId: string,
): Promise<{ ok: boolean; conversationId?: string; error?: string }> {
  try {
    const { profile } = await requireAdmin();
    if (!eventId) return { ok: false, error: "Event-ID fehlt." };

    const sb = admin();

    const { data: event } = await sb
      .from("events")
      .select("id, title, chat_conversation_id")
      .eq("id", eventId)
      .maybeSingle();
    if (!event) return { ok: false, error: "Event nicht gefunden." };
    if (event.chat_conversation_id) {
      return { ok: false, error: "Event hat bereits einen Chat.", conversationId: event.chat_conversation_id };
    }

    const memberIds = await loadEventChatMembers(sb, eventId);
    if (memberIds.length === 0) {
      return { ok: false, error: "Keine Admin/Manager/confirmed-Signups gefunden." };
    }

    // Conversation anlegen
    const title = `Event · ${event.title}`.slice(0, 120);
    const { data: conv, error: cErr } = await sb
      .from("conversations")
      .insert({ type: "group", title, created_by: profile.id })
      .select("id")
      .single();
    if (cErr || !conv) return { ok: false, error: cErr?.message ?? "Conversation-Insert fehlgeschlagen." };

    // Member-Rows
    const memberRows = memberIds.map((pid) => ({
      conversation_id: conv.id,
      profile_id: pid,
      role: pid === profile.id ? "owner" : "member",
    }));
    const { error: mErr } = await sb.from("conversation_members").insert(memberRows);
    if (mErr) {
      await sb.from("conversations").delete().eq("id", conv.id);
      return { ok: false, error: `Member-Insert: ${mErr.message}` };
    }

    // Event-Link setzen
    const { error: uErr } = await sb
      .from("events")
      .update({ chat_conversation_id: conv.id })
      .eq("id", eventId);
    if (uErr) {
      return { ok: false, error: `Event-Update: ${uErr.message}` };
    }

    revalidatePath(`/portal/admin/events/${eventId}`);
    revalidatePath(`/portal/events/${eventId}`);
    revalidatePath("/portal/admin/inbox/groups");
    revalidatePath("/portal/inbox");
    await writeAudit({
      actorId: profile.id,
      actorRole: profile.role,
      action: "event.chat.create",
      targetTable: "events",
      targetId: eventId,
      payload: { conversation_id: conv.id, member_count: memberIds.length },
    });
    return { ok: true, conversationId: conv.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler" };
  }
}

// Sync nach neuen confirmed-Signups: fehlende Member adden.
export async function syncEventChatMembers(
  eventId: string,
): Promise<{ ok: boolean; added?: number; error?: string }> {
  try {
    const { profile } = await requireAdmin();
    const sb = admin();

    const { data: event } = await sb
      .from("events")
      .select("id, chat_conversation_id")
      .eq("id", eventId)
      .maybeSingle();
    if (!event?.chat_conversation_id) {
      return { ok: false, error: "Event hat noch keinen Chat." };
    }

    const target = new Set(await loadEventChatMembers(sb, eventId));
    const { data: current } = await sb
      .from("conversation_members")
      .select("profile_id")
      .eq("conversation_id", event.chat_conversation_id);
    const currentIds = new Set((current ?? []).map((c) => c.profile_id));
    const missing = Array.from(target).filter((id) => !currentIds.has(id));

    if (missing.length === 0) {
      return { ok: true, added: 0 };
    }

    const rows = missing.map((pid) => ({
      conversation_id: event.chat_conversation_id!,
      profile_id: pid,
      role: "member",
    }));
    const { error } = await sb.from("conversation_members").insert(rows);
    if (error) return { ok: false, error: error.message };

    revalidatePath(`/portal/admin/events/${eventId}`);
    revalidatePath(`/portal/admin/inbox/groups/${event.chat_conversation_id}`);
    await writeAudit({
      actorId: profile.id,
      actorRole: profile.role,
      action: "event.chat.sync",
      targetTable: "events",
      targetId: eventId,
      payload: { added: missing.length, conversation_id: event.chat_conversation_id },
    });
    return { ok: true, added: missing.length };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler" };
  }
}
