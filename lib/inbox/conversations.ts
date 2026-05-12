"use server";

// Phase D · Gruppen-Conversations.
// Direct-Messages bleiben unveraendert (subject-basiert via messages-Tabelle).
// Gruppen laufen via conversations + conversation_members + messages.conversation_id.

import { revalidatePath } from "next/cache";
import { createClient as createSsr } from "@/lib/supabase/server";
import { createClient as createSr } from "@supabase/supabase-js";

type ConvType = "group" | "channel" | "event";

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
  const { data: member } = await supabase
    .from("conversation_members")
    .select("id, role")
    .eq("conversation_id", conversationId)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!member) {
    // Admin darf auch ohne Member-Eintrag
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!profile || profile.role !== "admin") throw new Error("Kein Zugriff.");
    return { user, role: "owner" as const };
  }
  return { user, role: member.role };
}

export async function createGroupConversation(input: {
  title: string;
  type: ConvType;
  memberIds: string[];
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const { user } = await requireAdminOrManager();
    if (!input.title || input.title.trim().length < 2) {
      return { ok: false, error: "Titel zu kurz." };
    }
    if (input.title.length > 120) return { ok: false, error: "Titel zu lang." };
    if (!["group", "channel", "event"].includes(input.type)) {
      return { ok: false, error: "Ungueltiger Typ." };
    }
    const memberIds = Array.from(new Set([...input.memberIds.filter(Boolean), user.id]));
    if (memberIds.length < 2) return { ok: false, error: "Mindestens ein weiteres Mitglied noetig." };

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
    if (cErr || !conv) return { ok: false, error: cErr?.message ?? "Insert fehlgeschlagen." };

    const memberRows = memberIds.map((pid) => ({
      conversation_id: conv.id,
      profile_id: pid,
      role: pid === user.id ? "owner" : "member",
    }));
    const { error: mErr } = await sb.from("conversation_members").insert(memberRows);
    if (mErr) {
      // Rollback Conversation, sonst dangling
      await sb.from("conversations").delete().eq("id", conv.id);
      return { ok: false, error: `Member-Insert fehlgeschlagen: ${mErr.message}` };
    }

    revalidatePath("/portal/admin/inbox/groups");
    revalidatePath("/portal/inbox");
    return { ok: true, id: conv.id };
  } catch (e) {
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
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const { user } = await requireConversationMember(input.conversationId);
    const body = input.body.trim();
    if (body.length < 1) return { ok: false, error: "Nachricht zu kurz." };
    if (body.length > 5000) return { ok: false, error: "Nachricht zu lang." };

    const sb = admin();
    const subject = body.length > 60 ? `${body.slice(0, 57)}...` : body;
    const nowIso = new Date().toISOString();

    const { data: msg, error: mErr } = await sb
      .from("messages")
      .insert({
        sender_id: user.id,
        conversation_id: input.conversationId,
        subject,
        body,
        category: "general",
        sent_at: nowIso,
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
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler" };
  }
}
