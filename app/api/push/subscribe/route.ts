// POST /api/push/subscribe
// Speichert oder updated eine Web-Push Subscription fuer den eingeloggten User.
// Endpoint UNIQUE: bei Duplikat wird user_id + last_seen_at upgedated.
//
// Body: { endpoint, keys: { p256dh, auth } }

import { NextRequest, NextResponse } from "next/server";
import { createClient as ssrClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4_000;
const UA_MAX = 256;

function deviceTypeFromUA(ua: string | null): string {
  if (!ua) return "unknown";
  const s = ua.toLowerCase();
  if (s.includes("tablet") || s.includes("ipad") || (s.includes("android") && !s.includes("mobile"))) return "tablet";
  if (s.includes("mobi") || s.includes("iphone") || s.includes("ipod") || s.includes("android")) return "mobile";
  return "desktop";
}

interface SubscribeBody {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function POST(req: NextRequest) {
  // Auth aus Session
  const sb = await ssrClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_BODY_BYTES) return NextResponse.json({ error: "body_too_large" }, { status: 413 });

  let body: SubscribeBody;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

  const endpoint = (body.endpoint || "").trim();
  const p256dh   = (body.keys?.p256dh || "").trim();
  const auth     = (body.keys?.auth   || "").trim();
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "invalid_subscription" }, { status: 400 });
  }
  if (endpoint.length > 1024 || p256dh.length > 256 || auth.length > 128) {
    return NextResponse.json({ error: "invalid_subscription" }, { status: 400 });
  }
  if (!/^https:\/\//.test(endpoint)) {
    return NextResponse.json({ error: "invalid_endpoint" }, { status: 400 });
  }

  const ua = (req.headers.get("user-agent") || "").slice(0, UA_MAX);
  const device_type = deviceTypeFromUA(ua);
  const now = new Date().toISOString();

  const db = admin();

  // Upsert auf unique endpoint
  const { error } = await db.from("push_subscriptions").upsert({
    user_id: user.id,
    endpoint,
    p256dh,
    auth,
    user_agent: ua || null,
    device_type,
    last_seen_at: now,
  }, { onConflict: "endpoint" });

  if (error) {
    console.error("[push/subscribe] insert failed", error.message);
    return NextResponse.json({ error: "store_failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
