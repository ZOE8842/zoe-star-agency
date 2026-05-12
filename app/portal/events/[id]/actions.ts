"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSsrClient } from "@/lib/supabase/server";
import { createClient as createSrClient } from "@supabase/supabase-js";

function admin() {
  return createSrClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function signupForEvent(
  eventId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createSsrClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Nicht eingeloggt." };

    const sb = admin();

    // Event laden + Status pruefen
    const { data: event, error: eErr } = await sb
      .from("events")
      .select("id, status, end_at, source, max_participants")
      .eq("id", eventId)
      .maybeSingle();
    if (eErr || !event) return { ok: false, error: eErr?.message ?? "Event nicht gefunden." };
    if (event.status !== "open") return { ok: false, error: "Event ist nicht offen fuer Anmeldungen." };
    if (event.source === "tiktok") return { ok: false, error: "TikTok-Events haben keine interne Anmeldung." };
    if (event.end_at && new Date(event.end_at) < new Date()) {
      return { ok: false, error: "Event ist bereits beendet." };
    }

    // Max-Participants-Check
    if (event.max_participants) {
      const { count } = await sb
        .from("event_signups")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .in("status", ["signed", "confirmed"]);
      if ((count ?? 0) >= event.max_participants) {
        return { ok: false, error: "Event ist voll." };
      }
    }

    // Upsert auf unique (event_id, creator_id)
    const { error: insErr } = await sb
      .from("event_signups")
      .upsert(
        {
          event_id: eventId,
          creator_id: user.id,
          status: "signed",
        },
        { onConflict: "event_id,creator_id", ignoreDuplicates: false },
      );
    if (insErr) return { ok: false, error: insErr.message };

    revalidatePath(`/portal/events/${eventId}`);
    revalidatePath("/portal/events");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler" };
  }
}

export async function cancelEventSignup(
  eventId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createSsrClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Nicht eingeloggt." };

    const sb = admin();
    const { error } = await sb
      .from("event_signups")
      .delete()
      .eq("event_id", eventId)
      .eq("creator_id", user.id);
    if (error) return { ok: false, error: error.message };

    revalidatePath(`/portal/events/${eventId}`);
    revalidatePath("/portal/events");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler" };
  }
}
