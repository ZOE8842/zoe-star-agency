"use server";

// Phase D · Gruppen-Conversations.
// Direct-Messages bleiben unveraendert (subject-basiert via messages-Tabelle).
// Gruppen laufen via conversations + conversation_members + messages.conversation_id.

import { revalidatePath } from "next/cache";
import { createClient as createSsr } from "@/lib/supabase/server";
import { createClient as createSr } from "@supabase/supabase-js";

// V1.7: Events sind ein eigenes System (events-Tabelle). Inbox-Conversations
// haben nur noch group + channel als Typen fuer neue Eintraege. Bestehende
// type='event'-Rows in conversations bleiben sichtbar (RLS unveraendert).
type ConvType = "group" | "channel";

function admin() {
  return createSr(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function requireAdminOrManager() {
  const supabase = await createSsr();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht eingeloggt.");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || (profile.role !== "admin" && profile.role !== "manager")) {
    throw new Error("Nur Admin/Manager.");
  }
  return { user, role: profile.role };
}

async function requireConversationMember(conversationId: string) {
  const supabase = await createSsr();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht eingeloggt.");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const profileRole = profile?.role ?? "creator";
  const { data: member } = await supabase
    .from("conversation_members")
    .select("id, role")
    .eq("conversation_id", conversationId)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!member) {
    // Admin/Manager darf auch ohne Member-Eintrag
    if (profileRole !== "admin" && profileRole !== "manager") {
      throw new Error("Kein Zugriff.");
    }
    return { user, role: "owner" as const, profileRole };
  }
  return { user, role: member.role, profileRole };
}

export async function createGroupConversation(input: {
  title: string;
  type: ConvType;
  memberIds: string[];
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const TAG = "[createGroupConversation]";
  try {
    const { user } = await requireAdminOrManager();

    if (!input.title || input.title.trim().length < 2) {
      return { ok: false, error: "Titel zu kurz." };
    }
    if (input.title.length > 120) return { ok: false, error: "Titel zu lang." };
    if (!["group", "channel"].includes(input.type)) {
      return { ok: false, error: "Ungueltiger Typ." };
    }
    const rawIds: string[] = Array.isArray(input.memberIds)
      ? input.memberIds
      : typeof input.memberIds === "string"
      ? [input.memberIds]
      : [];
    const memberIds = Array.from(new Set([...rawIds.filter((id) => typeof id === "string" && id.length > 0), user.id]));

    if (memberIds.length < 2) {
      return { ok: false, error: `Mindestens ein weiteres Mitglied noetig (erhalten: ${rawIds.length} input ids).` };
    }

    const sb = admin();
    const { data: conv, error: cErr } = await sb
      .from("conversations")
      .insert({
        type: input.type,
        title: input.title.trim(),
        created_by: user.id,
      })
      .select("id")
      .single();
    if (cErr || !conv) {
      console.error(TAG, "conversation insert failed:", cErr);
      return { ok: false, error: cErr?.message ?? "Insert fehlgeschlagen." };
    }

    const memberRows = memberIds.map((pid) => ({
      conversation_id: conv.id,
      profile_id: pid,
      role: pid === user.id ? "owner" : "member",
    }));

    const { data: insertedRows, error: mErr } = await sb
      .from("conversation_members")
      .insert(memberRows)
      .select("id, profile_id, role");
    if (mErr) {
      console.error(TAG, "member insert failed:", mErr);
      await sb.from("conversations").delete().eq("id", conv.id);
      return { ok: false, error: `Member-Insert fehlgeschlagen: ${mErr.message}` };
    }
    const insertedCount = insertedRows?.length ?? 0;

    if (insertedCount !== memberRows.length) {
      console.error(TAG, "incomplete member insert:", insertedCount, "/", memberRows.length);
      return {
        ok: false,
        error: `Member-Insert unvollstaendig: ${insertedCount}/${memberRows.length}`,
      };
    }

    revalidatePath("/portal/admin/inbox/groups");
    revalidatePath("/portal/inbox");
    return { ok: true, id: conv.id };
  } catch (e) {
    console.error(TAG, "exception:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Fehler" };
  }
}

export async function addConversationMember(
  conversationId: string,
  profileId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdminOrManager();
    const sb = admin();
    const { error } = await sb
      .from("conversation_members")
      .insert({ conversation_id: conversationId, profile_id: profileId, role: "member" });
    if (error && !error.message.includes("duplicate")) {
      return { ok: false, error: error.message };
    }
    revalidatePath(`/portal/admin/inbox/groups/${conversationId}`);
    revalidatePath("/portal/inbox");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler" };
  }
}

export async function removeConversationMember(
  conversationId: string,
  profileId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdminOrManager();
    const sb = admin();
    const { error } = await sb
      .from("conversation_members")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("profile_id", profileId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/portal/admin/inbox/groups/${conversationId}`);
    revalidatePath("/portal/inbox");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler" };
  }
}

export async function sendToConversation(input: {
  conversationId: string;
  body: string;
  /** Channel-Posts mit requires_ack: Empfaenger sehen einen "Bestaetigen"-Button. */
  requires_ack?: boolean;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const { user, profileRole } = await requireConversationMember(input.conversationId);
    const body = input.body.trim();
    if (body.length < 1) return { ok: false, error: "Nachricht zu kurz." };
    if (body.length > 5000) return { ok: false, error: "Nachricht zu lang." };

    const sb = admin();

    // Channel-Write-Permission: nur Admin/Manager duerfen in Channels schreiben.
    // Gruppen + Events: alle Mitglieder duerfen schreiben.
    const { data: convMeta } = await sb
      .from("conversations")
      .select("type")
      .eq("id", input.conversationId)
      .maybeSingle();
    if (!convMeta) return { ok: false, error: "Conversation nicht gefunden." };
    if (convMeta.type === "channel" && profileRole !== "admin" && profileRole !== "manager") {
      return { ok: false, error: "In Channels schreiben nur Admin/Manager." };
    }
    const subject = body.length > 60 ? `${body.slice(0, 57)}...` : body;
    const nowIso = new Date().toISOString();
    // requires_ack nur fuer Channel-Posts und nur fuer Staff erlauben.
    const requiresAck =
      !!input.requires_ack
      && convMeta.type === "channel"
      && (profileRole === "admin" || profileRole === "manager");

    const { data: msg, error: mErr } = await sb
      .from("messages")
      .insert({
        sender_id: user.id,
        conversation_id: input.conversationId,
        subject,
        body,
        category: "general",
        sent_at: nowIso,
        requires_ack: requiresAck,
      })
      .select("id")
      .single();
    if (mErr || !msg) return { ok: false, error: mErr?.message ?? "Insert fehlgeschlagen." };

    // last_message_at auf Conversation pflegen
    await sb
      .from("conversations")
      .update({ last_message_at: nowIso })
      .eq("id", input.conversationId);

    // last_read_at fuer Sender selbst (er hat ja gerade gesendet)
    await sb
      .from("conversation_members")
      .update({ last_read_at: nowIso })
      .eq("conversation_id", input.conversationId)
      .eq("profile_id", user.id);

    revalidatePath(`/portal/inbox/group/${input.conversationId}`);
    revalidatePath("/portal/inbox");
    revalidatePath(`/portal/admin/inbox/groups/${input.conversationId}`);
    return { ok: true, id: msg.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler" };
  }
}

export async function markConversationRead(
  conversationId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createSsr();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Nicht eingeloggt." };
    const sb = admin();
    await sb
      .from("conversation_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("profile_id", user.id);
    // Inbox-Liste + Bell-Indicator revalidieren — Unread-Badge geht weg.
    // revalidatePath kann aus Server-Component-Render werfen → try/catch.
    try {
      revalidatePath("/portal/inbox");
      revalidatePath(`/portal/inbox/group/${conversationId}`);
    } catch {
      /* ignore */
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler" };
  }
}
