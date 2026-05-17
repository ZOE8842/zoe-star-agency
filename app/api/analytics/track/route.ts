// POST /api/analytics/track
// Public-callable (authenticated session) Tracking-Endpoint.
// User-ID + Profile-ID werden serverseitig aus der Session abgeleitet.
// Insert via Service-Role intern.
//
// Rate-Limit: in-memory 60 req/min pro session_id (verhindert Bot-Spam,
// Dedupe-Window 60s im trackPortalEvent faengt Refresh-Wiederholungen).
//
// Marketing-Metadata (locale, referrer, utm_*, user_agent, device_type)
// kommt vom Client + wird durch Server-Header ergaenzt/ueberschrieben:
//   - referrer: Client kann document.referrer schicken, Server faellt
//     sonst auf Referer-Header zurueck.
//   - locale:   Client kann zoe_public_lang lesen, Server faellt sonst
//     auf Cookie-Header zurueck.
//   - user_agent + device_type: IMMER Server-Side (kein Trust auf Client-UA).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { trackPortalEvent, type PortalEventType } from "@/lib/analytics/trackPortalEvent";
import {
  cap, deviceTypeFromUA, localeFromCookieString,
  LOCALE_MAX, REFERRER_MAX, UTM_MAX, USER_AGENT_MAX, PATH_MAX,
} from "@/lib/analytics/classify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Client-postable Events (Public-Track-Endpoint).
// creator_application_submit ist BEWUSST NICHT hier - der Event wird
// ausschliesslich server-side in /api/creator-applications nach
// erfolgreichem DB-Insert gefeuert (sonst Inflation-Risiko durch
// gefakte Submit-Events ohne echte Anwendung). Codex-Finding P2.
const VALID_EVENTS: ReadonlySet<PortalEventType> = new Set([
  "page_view", "login_success", "logout", "portal_open",
  "admin_open", "creator_dashboard_open",
  "public_page_view", "join_open",
]);

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

interface TrackBody {
  event_type?: string;
  path?: string;
  session_id?: string;
  locale?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export async function POST(req: NextRequest) {
  let body: TrackBody;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }

  const event_type = body?.event_type;
  if (!event_type || !VALID_EVENTS.has(event_type as PortalEventType)) {
    return NextResponse.json({ error: "invalid event_type" }, { status: 400 });
  }
  const path       = cap(body.path,       PATH_MAX);
  const session_id = cap(body.session_id, 64);

  const rateKey = session_id
    || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
  if (!rateLimit(rateKey)) {
    return NextResponse.json({ error: "rate_limit" }, { status: 429 });
  }

  // Marketing-Metadata zusammenstellen (Client-Input + Server-Header-Fallback).
  const ua          = cap(req.headers.get("user-agent"), USER_AGENT_MAX);
  const device_type = deviceTypeFromUA(ua);
  const referrer    = cap(body.referrer, REFERRER_MAX)
                   ?? cap(req.headers.get("referer"), REFERRER_MAX);
  const locale      = cap(body.locale, LOCALE_MAX)
                   ?? localeFromCookieString(req.headers.get("cookie"));

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
    locale,
    referrer,
    utm_source:   cap(body.utm_source,   UTM_MAX),
    utm_medium:   cap(body.utm_medium,   UTM_MAX),
    utm_campaign: cap(body.utm_campaign, UTM_MAX),
    utm_content:  cap(body.utm_content,  UTM_MAX),
    utm_term:     cap(body.utm_term,     UTM_MAX),
    user_agent:   ua,
    device_type,
    event_source: "client",
  });

  return NextResponse.json({ success: true });
}
