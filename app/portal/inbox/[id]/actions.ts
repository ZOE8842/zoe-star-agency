"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSrvClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Mark-as-read — idempotent. Wenn chainIds uebergeben werden, werden ALLE
// Messages des Threads als gelesen markiert. Sonst nur die einzelne msg.
// revalidatePath am Ende sorgt dafuer, dass die Inbox-Liste nach
// Page-Open sofort den korrekten Unread-State zeigt.
export async function markRead(
  messageId: string,
  userId: string,
  chainIds?: string[],
) {
  const admin = createSrvClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const allIds = Array.from(new Set([messageId, ...(chainIds ?? [])]));
  if (allIds.length === 0) return;

  // Bereits gelesene message_reads pruefen
  const { data: existingReads } = await admin
    .from("message_reads")
    .select("id, message_id, read_at")
    .eq("reader_id", userId)
    .in("message_id", allIds);
  const existingMap = new Map(
    (existingReads ?? []).map((r) => [r.message_id, r]),
  );

  const now = new Date().toISOString();
  const inserts: Array<{ message_id: string; reader_id: string; read_at: string }> = [];
  const updateIds: string[] = [];

  for (const mid of allIds) {
    const existing = existingMap.get(mid);
    if (existing?.read_at) continue; // bereits gelesen
    if (existing) {
      updateIds.push(existing.id);
    } else {
      inserts.push({ message_id: mid, reader_id: userId, read_at: now });
    }
  }

  if (inserts.length > 0) {
    await admin.from("message_reads").insert(inserts);
  }
  if (updateIds.length > 0) {
    await admin
      .from("message_reads")
      .update({ read_at: now })
      .in("id", updateIds);
  }

  // Inbox-Liste + Detail-Page revalidieren — Unread-Badge verschwindet
  // nach Page-Open sofort. revalidatePath kann beim Aufruf aus
  // Server-Component-Render in seltenen Faellen werfen → try/catch.
  try {
    revalidatePath("/portal/inbox");
    revalidatePath(`/portal/inbox/${messageId}`);
  } catch {
    /* ignore — naechster Page-Visit nutzt force-dynamic sowieso */
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
