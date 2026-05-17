"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSrvClient, type SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications/center";

interface SendArgs {
  recipientId?: string;
  recipientGroup?: "all_creators";
  subject: string;
  body: string;
  attachments?: string[];
}

export async function sendMessage({ recipientId, recipientGroup, subject, body, attachments }: SendArgs) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht eingeloggt." };

  // Subject ist optional — wenn leer, nehmen wir die ersten ~40 Zeichen
  // aus dem Body als Preview-Subject. Body bleibt Pflicht.
  if (body.trim().length < 2) {
    return { error: "Nachricht zu kurz." };
  }
  if (body.length > 5000) {
    return { error: "Nachricht zu lang." };
  }
  let effectiveSubject = subject.trim();
  if (!effectiveSubject) {
    const cleaned = body.trim().replace(/\s+/g, " ");
    effectiveSubject = cleaned.length > 40
      ? `${cleaned.slice(0, 37)}...`
      : cleaned;
  }
  if (effectiveSubject.length > 200) effectiveSubject = effectiveSubject.slice(0, 200);

  const admin = createSrvClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Broadcast: nur fuer Admin/Manager. Pruefen.
  if (recipientGroup === "all_creators") {
    const { data: senderProfile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (!senderProfile || (senderProfile.role !== "admin" && senderProfile.role !== "manager")) {
      return { error: "Broadcast nur fuer Admin/Manager." };
    }
  }
  if (!recipientGroup && !recipientId) {
    return { error: "Empfaenger fehlt." };
  }

  const insertPayload: Record<string, unknown> = {
    sender_id: user.id,
    subject: effectiveSubject,
    body: body.trim(),
    // Enum-Wert "general" — Direct-Messages werden ueber recipient_group=null
    // + recipient_id!=null identifiziert, nicht ueber category.
    category: "general",
    sent_at: new Date().toISOString(),
  };
  if (recipientGroup === "all_creators") {
    insertPayload.recipient_group = "all_creators";
    insertPayload.category = "general";
  } else {
    insertPayload.recipient_id = recipientId;
  }
  if (attachments && attachments.length > 0) {
    insertPayload.attachments = attachments;
  }

  const { data: inserted, error } = await admin
    .from("messages")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    // Falls Spalte attachments noch fehlt: ohne attachments retry
    if (error.message.includes("attachments")) {
      delete insertPayload.attachments;
      const { data: retryInsert, error: retry } = await admin
        .from("messages")
        .insert(insertPayload)
        .select("id")
        .single();
      if (!retry && retryInsert) {
        revalidatePath("/portal/inbox");
        revalidatePath(`/portal/inbox/${retryInsert.id}`);
        return { success: true, id: retryInsert.id, attachmentsSkipped: true };
      }
      return { error: `Senden fehlgeschlagen: ${retry?.message ?? "unbekannt"}` };
    }
    return { error: `Senden fehlgeschlagen: ${error.message}` };
  }

  revalidatePath("/portal/inbox");
  revalidatePath(`/portal/inbox/${inserted.id}`);

  // Push + Notification-Center an Empfaenger (Best-Effort, fail-silent).
  // Bei Broadcast: alle aktiven Creator. Sonst: single recipient.
  void fireInboxNotifications(admin, inserted.id, effectiveSubject, recipientGroup, recipientId);

  return { success: true, id: inserted.id };
}

async function fireInboxNotifications(
  admin: SupabaseClient,
  messageId: string,
  subject: string,
  recipientGroup?: string,
  recipientId?: string,
): Promise<void> {
  try {
    const targetUrl = `/portal/inbox/${messageId}`;
    const titleShort = "Neue Nachricht";
    const bodyShort = subject.length > 120 ? `${subject.slice(0, 117)}…` : subject;

    if (recipientGroup === "all_creators") {
      const { data: creators } = await admin
        .from("profiles")
        .select("id")
        .eq("role", "creator")
        .eq("status", "active");
      if (creators) {
        await Promise.all(creators.map(c => createNotification({
          user_id: c.id,
          type: "inbox_message",
          title: titleShort,
          body: bodyShort,
          target_url: targetUrl,
          metadata: { message_id: messageId, broadcast: true },
        })));
      }
    } else if (recipientId) {
      await createNotification({
        user_id: recipientId,
        type: "inbox_message",
        title: titleShort,
        body: bodyShort,
        target_url: targetUrl,
        metadata: { message_id: messageId },
      });
    }
  } catch (e) {
    console.warn("[inbox notify] failed", e instanceof Error ? e.message : e);
  }
}
