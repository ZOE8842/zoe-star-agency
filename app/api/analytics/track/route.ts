// POST /api/analytics/track
// Public-callable (authenticated session) Tracking-Endpoint.
// User-ID + Profile-ID werden serverseitig aus der Session abgeleitet.
// Insert via Service-Role intern.
//
// Rate-Limit: in-memory 60 req/min pro session_id (verhindert Bot-Spam,
// Dedupe-Window 60s im trackPortalEvent fängt Refresh-Wiederholungen).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { trackPortalEvent, type PortalEventType } from "@/lib/analytics/trackPortalEvent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_EVENTS: ReadonlySet<PortalEventType> = new Set([
  "page_view", "login_success", "logout", "portal_open",
  "admin_open", "creator_dashboard_open",
]);

// in-memory rate limit pro session_id
const rateMap = new Map<string, { count: number; reset: number }>();
const MIN = 60 * 1000;
const LIMIT_PER_MIN = 60;

function rateLimit(key: string): boolean {
  const now = Date.now();
  const rec = rateMap.get(key);
  if (!rec || rec.reset < now) {
    rateMap.set(key, { count: 1, reset: now + MIN });
    return true;
  }
  if (rec.count >= LIMIT_PER_MIN) return false;
  rec.count++;
  return true;
}

export async function POST(req: NextRequest) {
  let body: { event_type?: string; path?: string; session_id?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }

  const event_type = body?.event_type;
  if (!event_type || !VALID_EVENTS.has(event_type as PortalEventType)) {
    return NextResponse.json({ error: "invalid event_type" }, { status: 400 });
  }
  const path = typeof body.path === "string" ? body.path.slice(0, 256) : null;
  const session_id = typeof body.session_id === "string"
    ? body.session_id.slice(0, 64)
    : null;

  // Rate-Limit-Schluessel: session_id oder IP-Hash fallback
  const rateKey = session_id
    || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
  if (!rateLimit(rateKey)) {
    return NextResponse.json({ error: "rate_limit" }, { status: 429 });
  }

  // User aus Session ableiten (kein Trust auf Client-Payload)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile_id: string | null = null;
  let role: string | null = null;
  if (user) {
    const { data: p } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();
    if (p) { profile_id = p.id; role = p.role; }
  }

  await trackPortalEvent({
    event_type: event_type as PortalEventType,
    user_id: user?.id ?? null,
    profile_id,
    role,
    path,
    session_id,
  });

  return NextResponse.json({ success: true });
}
