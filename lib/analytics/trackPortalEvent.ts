// Server-Helper fuer Portal-Aktivitaets-Tracking.
// Insert via Service-Role in admin_analytics_events.
//
// Dedupe-Logik: identisches (session_id + path + event_type) innerhalb
// DEDUPE_WINDOW_SEC wird ignoriert (verhindert Refresh-Spam ohne
// kompletten Unique-Constraint, der zu starr waere).
//
// Keine IP, keine PII. session_id ist ein anonymer UUID aus dem Cookie.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type PortalEventType =
  | "page_view"
  | "login_success"
  | "logout"
  | "portal_open"
  | "admin_open"
  | "creator_dashboard_open"
  // Public Website Analytics
  | "public_page_view"
  | "join_open"
  | "creator_application_submit";

export interface TrackPortalEventInput {
  event_type: PortalEventType;
  user_id?: string | null;
  profile_id?: string | null;
  role?: string | null;
  path?: string | null;
  session_id?: string | null;
}

const DEDUPE_WINDOW_SEC = 60;

let _client: SupabaseClient | null = null;
function admin(): SupabaseClient | null {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _client;
}

export async function trackPortalEvent(input: TrackPortalEventInput): Promise<void> {
  try {
    const sb = admin();
    if (!sb) return; // Env fehlt → silent skip (kein Crash, kein Leak)

    // Dedupe-Check nur sinnvoll wenn session_id vorhanden.
    if (input.session_id) {
      const since = new Date(Date.now() - DEDUPE_WINDOW_SEC * 1000).toISOString();
      const { data: recent, error: dupErr } = await sb
        .from("admin_analytics_events")
        .select("id")
        .eq("session_id", input.session_id)
        .eq("event_type", input.event_type)
        .eq("path", input.path ?? "")
        .gte("created_at", since)
        .limit(1);
      if (!dupErr && recent && recent.length > 0) return;
    }

    await sb.from("admin_analytics_events").insert({
      event_type: input.event_type,
      user_id: input.user_id ?? null,
      profile_id: input.profile_id ?? null,
      role: input.role ?? null,
      path: input.path ?? null,
      session_id: input.session_id ?? null,
    });
  } catch (e) {
    // Tracking darf NIEMALS den User-Flow brechen
    console.error("[trackPortalEvent]", e instanceof Error ? e.message : e);
  }
}
