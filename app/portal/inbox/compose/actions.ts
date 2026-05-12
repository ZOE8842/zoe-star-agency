"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSrvClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

interface SendArgs {
  recipientId: string;
  subject: string;
  body: string;
  attachments?: string[];
}

export async function sendMessage({ recipientId, subject, body, attachments }: SendArgs) {
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

  const insertPayload: Record<string, unknown> = {
    sender_id: user.id,
    recipient_id: recipientId,
    subject: effectiveSubject,
    body: body.trim(),
    // Enum-Wert "general" — Direct-Messages werden ueber recipient_group=null
    // + recipient_id!=null identifiziert, nicht ueber category.
    category: "general",
    sent_at: new Date().toISOString(),
  };
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
  return { success: true, id: inserted.id };
}
