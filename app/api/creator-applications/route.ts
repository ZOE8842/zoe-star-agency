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

// Username-Normalisierung:
// - alle fuehrenden @ entfernen
// - trim
// - Validierung NACH Normalisierung: nur [A-Za-z0-9._-], 2-63 Zeichen
// Damit funktionieren sowohl "deinusername" als auch "@deinusername"
// als auch "@@@deinusername". URL im Username-Feld wird abgelehnt (kein /).
const NORMALIZED_USERNAME_RE = /^[A-Za-z0-9._-]{2,63}$/;

function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@+/, "");
}

// Profile-URL: nur https://(www.)tiktok.com Hosts. Andere URLs werden NICHT
// hart abgelehnt sondern verworfen → API generiert dann auto-URL aus username.
// Render-side bleibt safeProfileUrl als Defense-in-Depth.
function sanitizeProfileUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (s.length === 0 || s.length > 300) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:") return null;
    const h = u.hostname.toLowerCase();
    if (h !== "tiktok.com" && h !== "www.tiktok.com" && !h.endsWith(".tiktok.com")) return null;
    return u.toString();
  } catch { return null; }
}

function normalizeTelegram(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const s = raw.trim().replace(/^@+/, "");
  return s.length >= 3 ? s : null;
}

// Zod-Schema: zeichen-permissive, Validierung in 2 Stufen:
// (1) Schema laesst fast alles durch + max-Laengen + types
// (2) Manuelle Checks NACH Normalisierung mit spezifischen Fehlermeldungen
const BodySchema = z.object({
  tiktok_username:     z.string().max(200).optional().or(z.literal("")),
  tiktok_profile_url:  z.string().max(300).optional().or(z.literal("")),
  tiktok_display_name: z.string().max(120).optional().or(z.literal("")),
  contact_method:      z.enum(["tiktok", "telegram"]).optional(),
  telegram_username:   z.string().max(64).optional().or(z.literal("")),
  language:            z.string().max(32).optional().or(z.literal("")),
  region:              z.string().max(64).optional().or(z.literal("")),
  message:             z.string().max(1500).optional().or(z.literal("")),
  consent_privacy:     z.boolean().optional(),
  company:             z.string().max(200).optional(), // Honeypot
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
    // Schema-Verletzung (z.B. zu lang) - generisch, sollte selten passieren
    return NextResponse.json(
      { error: "Ungueltige Anfrage. Bitte Eingaben pruefen." },
      { status: 400 },
    );
  }
  const b = parsed.data;

  // Honeypot: still drop (Bot soll glauben es klappt)
  if (b.company && b.company.length > 0) {
    return NextResponse.json({ success: true });
  }

  // === Spezifische Pflichtfeld-Checks NACH Normalisierung ===

  // 1) TikTok-Username (Pflicht, normalisierbar)
  const username = normalizeUsername(b.tiktok_username ?? "");
  if (!username) {
    return NextResponse.json(
      { error: "Bitte gib deinen TikTok Username ein." },
      { status: 400 },
    );
  }
  if (!NORMALIZED_USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: "TikTok Username darf nur Buchstaben, Zahlen, Punkt, Unterstrich und Bindestrich enthalten (2-63 Zeichen)." },
      { status: 400 },
    );
  }

  // 2) Kontakt-Methode (Pflicht, default tiktok wenn fehlt)
  const contactMethod = b.contact_method ?? "tiktok";

  // 3) Telegram-Username (nur Pflicht wenn contact_method=telegram)
  const telegramUsername = normalizeTelegram(b.telegram_username);
  if (contactMethod === "telegram" && !telegramUsername) {
    return NextResponse.json(
      { error: "Bitte gib deinen Telegram Username ein, wenn du Telegram auswaehlst." },
      { status: 400 },
    );
  }

  // 4) Datenschutz-Consent (Pflicht)
  if (b.consent_privacy !== true) {
    return NextResponse.json(
      { error: "Bitte akzeptiere den Datenschutz, um deine Anfrage abzusenden." },
      { status: 400 },
    );
  }

  // Profile-URL: ungueltige URLs WERDEN NICHT GEBLOCKT, sondern verworfen
  // und durch Auto-URL ersetzt. So scheitert das Formular nicht an einem Typo.
  const profileUrl = sanitizeProfileUrl(b.tiktok_profile_url)
    ?? `https://www.tiktok.com/@${username}`;

  const insertRow = {
    tiktok_username: username,
    tiktok_profile_url: profileUrl,
    tiktok_display_name: (b.tiktok_display_name?.trim() || null),
    contact_method: contactMethod,
    telegram_username: telegramUsername,
    language: (b.language?.trim() || null),
    region: (b.region?.trim() || null),
    message: (b.message?.trim() || null),
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
          <tr><td style="padding:4px 10px;color:#888;">Kontakt</td><td style="padding:4px 10px;">${escapeHtml(contactMethod)}${telegramUsername ? ` @${escapeHtml(telegramUsername)}` : ""}</td></tr>
          ${insertRow.language ? `<tr><td style="padding:4px 10px;color:#888;">Sprache</td><td style="padding:4px 10px;">${escapeHtml(insertRow.language)}</td></tr>` : ""}
          ${insertRow.region ? `<tr><td style="padding:4px 10px;color:#888;">Region</td><td style="padding:4px 10px;">${escapeHtml(insertRow.region)}</td></tr>` : ""}
          <tr><td style="padding:4px 10px;color:#888;">Profil</td><td style="padding:4px 10px;"><a href="${escapeHtml(insertRow.tiktok_profile_url)}">${escapeHtml(insertRow.tiktok_profile_url)}</a></td></tr>
        </table>
        ${insertRow.message ? `<hr style="border:none;border-top:1px solid #ddd;margin:14px 0;" /><p style="white-space:pre-wrap;font-family:Arial,sans-serif;">${escapeHtml(insertRow.message)}</p>` : ""}
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
