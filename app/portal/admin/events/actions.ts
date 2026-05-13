"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { createClient as createSrClient } from "@supabase/supabase-js";

const CATEGORIES = ["live", "battle", "ranking", "special", "announcement"] as const;
// event_status-Enum in DB: draft / open / closed / archived
// "completed" wurde frueher hier irrtuemlich verwendet → Insert-Failure
const STATUSES = ["draft", "open", "closed", "archived"] as const;
const SOURCES = ["agency", "tiktok"] as const;

type EventInput = {
  title: string;
  description?: string | null;
  category: string;
  source: string;
  start_at: string; // ISO
  end_at?: string | null;
  max_participants?: number | null;
  prize_description?: string | null;
  registration_url?: string | null;
  rules?: string | null;
  cover_image_url?: string | null;
  status: string;
  visibility_mode?: "all" | "selected";
  allowed_profile_ids?: string[];
  requires_registration?: boolean;
};

function admin() {
  return createSrClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

function validate(input: EventInput): string | null {
  if (!input.title || input.title.trim().length < 2) return "Titel zu kurz.";
  if (input.title.length > 200) return "Titel zu lang.";
  if (!(CATEGORIES as readonly string[]).includes(input.category)) return "Kategorie ungueltig.";
  if (!(SOURCES as readonly string[]).includes(input.source)) return "Source ungueltig.";
  if (!(STATUSES as readonly string[]).includes(input.status)) return "Status ungueltig.";
  if (!input.start_at) return "Start-Datum erforderlich.";
  const start = new Date(input.start_at);
  if (isNaN(start.getTime())) return "Start-Datum ungueltig.";
  if (input.end_at) {
    const end = new Date(input.end_at);
    if (isNaN(end.getTime())) return "End-Datum ungueltig.";
    if (end.getTime() <= start.getTime()) return "End-Datum muss nach Start liegen.";
  }
  if (input.registration_url && !/^https?:\/\//i.test(input.registration_url)) {
    return "Registration-URL muss mit http(s) beginnen.";
  }
  if (input.source === "tiktok" && !input.registration_url) {
    return "TikTok-Events brauchen eine Registration-URL.";
  }
  if (input.cover_image_url && !/^https?:\/\//i.test(input.cover_image_url)) {
    return "Cover-URL muss mit http(s) beginnen.";
  }
  if (input.max_participants !== null && input.max_participants !== undefined) {
    if (input.max_participants < 1 || input.max_participants > 10_000) {
      return "Max-Participants ausserhalb 1-10000.";
    }
  }
  return null;
}

export async function adminCreateEvent(
  input: EventInput,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const { profile } = await requireAdmin();
    const err = validate(input);
    if (err) return { ok: false, error: err };

    const visibility = input.visibility_mode === "selected" ? "selected" : "all";
    const allowedIds = visibility === "selected"
      ? (input.allowed_profile_ids ?? []).filter((id) => typeof id === "string" && id.length > 0)
      : [];
    if (visibility === "selected" && allowedIds.length === 0) {
      return { ok: false, error: "Bei 'Ausgewaehlte Creator' mindestens 1 Profil waehlen." };
    }

    const sb = admin();
    const { data, error } = await sb
      .from("events")
      .insert({
        title: input.title.trim(),
        description: input.description?.trim() || null,
        category: input.category,
        source: input.source,
        start_at: input.start_at,
        end_at: input.end_at || null,
        max_participants: input.max_participants ?? null,
        prize_description: input.prize_description?.trim() || null,
        registration_url: input.registration_url?.trim() || null,
        rules: input.rules?.trim() || null,
        cover_image_url: input.cover_image_url?.trim() || null,
        status: input.status,
        visibility_mode: visibility,
        requires_registration: input.requires_registration !== false,
        created_by: profile.id,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    if (visibility === "selected" && allowedIds.length > 0) {
      const allowRows = allowedIds.map((pid) => ({
        event_id: data.id,
        profile_id: pid,
      }));
      const { error: aErr } = await sb.from("event_allowed_profiles").insert(allowRows);
      if (aErr) {
        // Rollback Event, sonst dangling
        await sb.from("events").delete().eq("id", data.id);
        return { ok: false, error: `Allowed-Profiles-Insert fehlgeschlagen: ${aErr.message}` };
      }
    }

    revalidatePath("/portal/admin/events");
    revalidatePath("/portal/events");
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler" };
  }
}

export async function adminUpdateEvent(
  id: string,
  input: EventInput,
): Promise<{ ok: boolean; error?: string }> {
  const TAG = "[AURA-RUNTIME-LOG adminUpdateEvent]";
  try {
    await requireAdmin();
    console.log(TAG, "id:", id, "requires_registration RAW:", input.requires_registration,
      "type:", typeof input.requires_registration,
      "computed (!==false):", input.requires_registration !== false);
    const err = validate(input);
    if (err) return { ok: false, error: err };

    const visibility = input.visibility_mode === "selected" ? "selected" : "all";
    const allowedIds = visibility === "selected"
      ? (input.allowed_profile_ids ?? []).filter((id) => typeof id === "string" && id.length > 0)
      : [];

    const sb = admin();
    const updatePayload = {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      category: input.category,
      source: input.source,
      start_at: input.start_at,
      end_at: input.end_at || null,
      max_participants: input.max_participants ?? null,
      prize_description: input.prize_description?.trim() || null,
      registration_url: input.registration_url?.trim() || null,
      rules: input.rules?.trim() || null,
      cover_image_url: input.cover_image_url?.trim() || null,
      status: input.status,
      visibility_mode: visibility,
      requires_registration: input.requires_registration !== false,
    };
    console.log(TAG, "updatePayload requires_registration:", updatePayload.requires_registration);

    const { error } = await sb
      .from("events")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      console.error(TAG, "update error:", error);
      return { ok: false, error: error.message };
    }

    // Verify DB-State direkt nach Update (kein cache, keine Server-Action-Race)
    const { data: verifyRow } = await sb
      .from("events")
      .select("id, requires_registration, status")
      .eq("id", id)
      .maybeSingle();
    console.log(TAG, "post-update verify:", verifyRow);

    // Allowed-Profiles synchronisieren: alte loeschen, neue setzen
    await sb.from("event_allowed_profiles").delete().eq("event_id", id);
    if (visibility === "selected" && allowedIds.length > 0) {
      const allowRows = allowedIds.map((pid) => ({
        event_id: id,
        profile_id: pid,
      }));
      await sb.from("event_allowed_profiles").insert(allowRows);
    }

    revalidatePath("/portal/admin/events");
    revalidatePath(`/portal/admin/events/${id}`);
    revalidatePath("/portal/events");
    revalidatePath(`/portal/events/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler" };
  }
}

export async function adminSetEventStatus(
  id: string,
  status: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (!(STATUSES as readonly string[]).includes(status)) return { ok: false, error: "Status ungueltig." };
    const sb = admin();
    const { error } = await sb.from("events").update({ status }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/portal/admin/events");
    revalidatePath(`/portal/admin/events/${id}`);
    revalidatePath("/portal/events");
    revalidatePath(`/portal/events/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler" };
  }
}

export async function adminCreateEventAndRedirect(input: EventInput): Promise<{ ok: boolean; error?: string }> {
  const r = await adminCreateEvent(input);
  if (!r.ok) return r;
  redirect("/portal/admin/events");
}

// Hard-Delete. event_signups + event_allowed_profiles cascaden via FK
// on delete cascade — manueller Cleanup nicht noetig. Storage-Cover bleibt
// erstmal liegen (Bucket-Pfade sind anonym, kein Stress).
export async function adminDeleteEvent(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (!id || typeof id !== "string") return { ok: false, error: "Ungueltige Event-ID." };
    const sb = admin();
    const { error } = await sb.from("events").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/portal/admin/events");
    revalidatePath("/portal/events");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler" };
  }
}
