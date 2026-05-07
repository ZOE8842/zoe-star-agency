"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSrvClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Mark-as-read — idempotent (upsert auf message_reads)
export async function markRead(messageId: string, userId: string) {
  const admin = createSrvClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Pruefen ob schon gelesen
  const { data: existing } = await admin
    .from("message_reads")
    .select("id, read_at")
    .eq("message_id", messageId)
    .eq("reader_id", userId)
    .maybeSingle();

  if (existing?.read_at) return; // bereits gelesen, nichts tun

  if (existing) {
    await admin
      .from("message_reads")
      .update({ read_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await admin.from("message_reads").insert({
      message_id: messageId,
      reader_id: userId,
      read_at: new Date().toISOString(),
    });
  }
}

export async function acknowledgeMessage(messageId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht eingeloggt." };

  const admin = createSrvClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const now = new Date().toISOString();

  // Upsert mit acknowledged_at
  const { data: existing } = await admin
    .from("message_reads")
    .select("id")
    .eq("message_id", messageId)
    .eq("reader_id", user.id)
    .maybeSingle();

  if (existing) {
    await admin
      .from("message_reads")
      .update({ acknowledged_at: now, read_at: now })
      .eq("id", existing.id);
  } else {
    await admin.from("message_reads").insert({
      message_id: messageId,
      reader_id: user.id,
      read_at: now,
      acknowledged_at: now,
    });
  }

  revalidatePath(`/portal/inbox/${messageId}`);
  revalidatePath("/portal/inbox");
  return { success: true };
}
