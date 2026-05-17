// POST /api/creator-applications
// Public Creator-Anfrage-Formular.
// - Honeypot (company)
// - In-Memory-Rate-Limit pro IP (5/h)
// - Body-Size-Cap
// - Service-Role-Insert in creator_applications
// - Optional Resend-Mail an info@zoe-star.de wenn RESEND_API_KEY gesetzt
//
// Keine IP / kein Tracking gespeichert. IP nur fuer Rate-Limit in-memory.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { trackPortalEvent } from "@/lib/analytics/trackPortalEvent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8_000;
const TARGET_EMAIL = "info@zoe-star.de";
const FROM_EMAIL = "ZOE Star Agency <noreply@zoe-star.de>";

// Username: optionales fuehrendes @ + dann ausschliesslich [A-Za-z0-9._-]
// Verhindert "@@", "foo@bar", reines "@@@..." etc.
const USERNAME_RE = /^@?[A-Za-z0-9._-]{2,63}$/;

// Profile-URL: nur https:// + nur tiktok.com Hosts (Sub-Domains erlaubt).
// Verhindert javascript:/data: URLs die im Admin als clickbarer Link
// gerendert wuerden (stored XSS / Script-Injection).
const safeTikTokUrl = z.string().trim().max(300).refine((val) => {
  try {
    const u = new URL(val);
    if (u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    return h === "tiktok.com" || h === "www.tiktok.com" || h.endsWith(".tiktok.com");
  } catch { return false; }
}, "Nur TikTok-Profil-URLs (https://www.tiktok.com/@user) erlaubt");

const BodySchema = z.object({
  tiktok_username: z.string().trim().regex(USERNAME_RE,
    "Username 2-63 Zeichen, nur Buchstaben/Zahlen/Punkt/Underscore/Minus"),
  tiktok_profile_url: safeTikTokUrl.optional().or(z.literal("")),
  tiktok_display_name: z.string().trim().max(120).optional().or(z.literal("")),
  contact_method: z.enum(["tiktok", "telegram"]),
  telegram_username: z.string().trim().max(64).optional().or(z.literal("")),
  language: z.string().trim().max(16).optional().or(z.literal("")),
  region: z.string().trim().max(64).optional().or(z.literal("")),
  message: z.string().trim().max(1500).optional().or(z.literal("")),
  consent_privacy: z.literal(true, {
    message: "Datenschutz-Hinweis muss bestaetigt werden",
  }),
  company: z.string().optional(), // Honeypot
});

// In-memory rate limit: 5 inserts pro IP pro Stunde
const rateMap = new Map<string, { count: number; reset: number }>();
const HOUR = 60 * 60 * 1000;
const LIMIT = 5;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const rec = rateMap.get(ip);
  if (!rec || rec.reset < now) {
    rateMap.set(ip, { count: 1, reset: now + HOUR });
    return true;
  }
  if (rec.count >= LIMIT) return false;
  rec.count++;
  return true;
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

async function readCapped(req: NextRequest): Promise<unknown> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_BODY_BYTES) throw new Error("body_too_large");
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) throw new Error("body_too_large");
  return JSON.parse(text);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip") || "unknown";

  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte spaeter erneut versuchen." },
      { status: 429 },
    );
  }

  let raw: unknown;
  try { raw = await readCapped(req); }
  catch (e) {
    const msg = e instanceof Error ? e.message : "invalid";
    return NextResponse.json(
      { error: msg === "body_too_large" ? "Anfrage zu gross." : "Ungueltige Anfrage." },
      { status: msg === "body_too_large" ? 413 : 400 },
    );
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Pflichtfelder fehlen oder ungueltig", issues: parsed.error.issues.slice(0, 6) },
      { status: 400 },
    );
  }
  const b = parsed.data;

  // Honeypot: still drop (Bot soll glauben es klappt)
  if (b.company && b.company.length > 0) {
    return NextResponse.json({ success: true });
  }

  // contact_method=telegram → telegram_username erforderlich
  if (b.contact_method === "telegram" && (!b.telegram_username || b.telegram_username.length < 3)) {
    return NextResponse.json(
      { error: "Telegram-Username fehlt." }, { status: 400 },
    );
  }

  const username = b.tiktok_username.replace(/^@+/, "");
  const insertRow = {
    tiktok_username: username,
    tiktok_profile_url: b.tiktok_profile_url || `https://www.tiktok.com/@${username}`,
    tiktok_display_name: b.tiktok_display_name || null,
    contact_method: b.contact_method,
    telegram_username: b.telegram_username ? b.telegram_username.replace(/^@+/, "") : null,
    language: b.language || null,
    region: b.region || null,
    message: b.message || null,
    consent_privacy: true,
    status: "new",
  };

  try {
    const supabase = adminClient();
    const { error } = await supabase.from("creator_applications").insert(insertRow);
    if (error) {
      console.error("[creator-applications] insert error:", error.message);
      return NextResponse.json(
        { error: "Speichern fehlgeschlagen. Bitte spaeter erneut versuchen." },
        { status: 500 },
      );
    }
    // Funnel-Tracking: erfolgreicher Insert = creator_application_submit
    // session_id aus Cookie ableiten (Funnel join_open → submit verbindbar)
    const sid = req.cookies.get("zoe_session_id")?.value ?? null;
    await trackPortalEvent({
      event_type: "creator_application_submit",
      path: "/join",
      session_id: sid,
    });
  } catch (e) {
    console.error("[creator-applications] crash:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Server-Fehler." }, { status: 500 });
  }

  // Optional E-Mail-Notification (best-effort, fail-silent)
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const html = `
        <h2>Neue Creator-Anfrage</h2>
        <table style="border-collapse:collapse;font-family:Arial,sans-serif;">
          <tr><td style="padding:4px 10px;color:#888;">TikTok</td><td style="padding:4px 10px;"><strong>@${escapeHtml(username)}</strong></td></tr>
          ${b.tiktok_display_name ? `<tr><td style="padding:4px 10px;color:#888;">Name</td><td style="padding:4px 10px;">${escapeHtml(b.tiktok_display_name)}</td></tr>` : ""}
          <tr><td style="padding:4px 10px;color:#888;">Kontakt</td><td style="padding:4px 10px;">${escapeHtml(b.contact_method)}${b.telegram_username ? ` @${escapeHtml(b.telegram_username.replace(/^@+/, ""))}` : ""}</td></tr>
          ${b.language ? `<tr><td style="padding:4px 10px;color:#888;">Sprache</td><td style="padding:4px 10px;">${escapeHtml(b.language)}</td></tr>` : ""}
          ${b.region ? `<tr><td style="padding:4px 10px;color:#888;">Region</td><td style="padding:4px 10px;">${escapeHtml(b.region)}</td></tr>` : ""}
          <tr><td style="padding:4px 10px;color:#888;">Profil</td><td style="padding:4px 10px;"><a href="${escapeHtml(insertRow.tiktok_profile_url)}">${escapeHtml(insertRow.tiktok_profile_url)}</a></td></tr>
        </table>
        ${b.message ? `<hr style="border:none;border-top:1px solid #ddd;margin:14px 0;" /><p style="white-space:pre-wrap;font-family:Arial,sans-serif;">${escapeHtml(b.message)}</p>` : ""}
        <p style="color:#888;font-size:11px;margin-top:18px;">Admin: /portal/admin/applications</p>
      `;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM_EMAIL, to: TARGET_EMAIL,
          subject: `[Creator-Anfrage] @${username}`, html,
        }),
      });
    } catch { /* fail-silent */ }
  }

  return NextResponse.json({ success: true });
}
