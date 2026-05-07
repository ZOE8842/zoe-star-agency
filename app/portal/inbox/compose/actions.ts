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

  if (subject.trim().length < 2 || body.trim().length < 10) {
    return { error: "Pflichtfelder zu kurz." };
  }
  if (subject.length > 200 || body.length > 5000) {
    return { error: "Nachricht zu lang." };
  }

  const admin = createSrvClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const insertPayload: Record<string, unknown> = {
    sender_id: user.id,
    recipient_id: recipientId,
    subject: subject.trim(),
    body: body.trim(),
    category: "direct",
    sent_at: new Date().toISOString(),
  };
  if (attachments && attachments.length > 0) {
    insertPayload.attachments = attachments;
  }

  const { error } = await admin.from("messages").insert(insertPayload);

  if (error) {
    // Falls Spalte attachments noch fehlt: ohne attachments retry
    if (error.message.includes("attachments")) {
      delete insertPayload.attachments;
      const { error: retry } = await admin.from("messages").insert(insertPayload);
      if (!retry) {
        revalidatePath("/portal/inbox");
        return { success: true, attachmentsSkipped: true };
      }
      return { error: `Senden fehlgeschlagen: ${retry.message}` };
    }
    return { error: `Senden fehlgeschlagen: ${error.message}` };
  }

  revalidatePath("/portal/inbox");
  return { success: true };
}
