// Kooperations-Anfrage-API: Resend → info@zoe-star.de
// Eigenes Sales-Formular für Brand-Anfragen, separat von /api/contact.
// Honeypot + In-Memory-Rate-Limit pro IP (5/h).

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  first_name: string;
  last_name: string;
  company: string;
  position?: string;
  email: string;
  phone?: string;
  type: string;
  message: string;
  budget?: string;
  honeypot?: string;
  // Optional · Creator-Context wenn ueber Detail-Seite oder Coop-Grid:
  creator_username?: string | null;
  creator_display_name?: string | null;
  creator_id?: string | null;
  creator_url?: string | null;
}

const TARGET_EMAIL = "nesip.vural@zoe-star.de";
const FROM_EMAIL = "ZOE Star Agency <noreply@zoe-star.de>";

const TYPES_LABELS: Record<string, string> = {
  live_campaign: "TikTok LIVE Kampagne",
  creator_coop: "Creator Kooperation",
  product_placement: "Produktplatzierung",
  event: "Event",
  long_term: "Langfristige Zusammenarbeit",
  other: "Sonstiges",
};

// In-Memory-Rate-Limit (5/h pro IP)
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Mail-Subject + Header-safe: kein CRLF, max-length cap
function cleanHeaderValue(value: string, max = 120): string {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, max);
}

// Whitelist: nur erlaubte Public-Domain + /creator/ Pfad
function validatedCreatorUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const allowedHosts = new Set([
      "zoe-star.de",
      "www.zoe-star.de",
      "zoe-star-agency.vercel.app",
    ]);
    if (!allowedHosts.has(url.host)) return null;
    if (!url.pathname.startsWith("/creator/")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";

  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte später erneut versuchen." },
      { status: 429 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof raw !== "object" || raw === null) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const rec = raw as Record<string, unknown>;

  if (
    !isString(rec.first_name) ||
    !isString(rec.last_name) ||
    !isString(rec.company) ||
    !isString(rec.email) ||
    !isString(rec.type) ||
    !isString(rec.message)
  ) {
    return NextResponse.json({ error: "Pflichtfelder fehlen." }, { status: 400 });
  }

  const body: Body = {
    first_name: rec.first_name,
    last_name: rec.last_name,
    company: rec.company,
    position: isString(rec.position) ? rec.position : undefined,
    email: rec.email,
    phone: isString(rec.phone) ? rec.phone : undefined,
    type: rec.type,
    message: rec.message,
    budget: isString(rec.budget) ? rec.budget : undefined,
    honeypot: isString(rec.honeypot) ? rec.honeypot : undefined,
    creator_username: isString(rec.creator_username) ? rec.creator_username : null,
    creator_display_name: isString(rec.creator_display_name) ? rec.creator_display_name : null,
    creator_id: isString(rec.creator_id) ? rec.creator_id : null,
    creator_url: isString(rec.creator_url) ? rec.creator_url : null,
  };

  // Honeypot
  if (body.honeypot && body.honeypot.length > 0) {
    return NextResponse.json({ success: true });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return NextResponse.json({ error: "Ungültige E-Mail-Adresse." }, { status: 400 });
  }
  if (body.message.length < 10 || body.message.length > 4000) {
    return NextResponse.json({ error: "Nachricht zu kurz oder zu lang." }, { status: 400 });
  }
  if (!TYPES_LABELS[body.type]) {
    return NextResponse.json({ error: "Ungültige Kooperationsart." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Mail-Service nicht konfiguriert." }, { status: 500 });
  }

  const typeLabel = TYPES_LABELS[body.type];
  const fullName = `${body.first_name} ${body.last_name}`.trim();

  // Creator-Context bereinigen
  const creatorUsername = body.creator_username
    ? cleanHeaderValue(body.creator_username.replace(/^@/, ""), 60)
    : "";
  const creatorDisplay = body.creator_display_name
    ? cleanHeaderValue(body.creator_display_name, 120)
    : "";
  const creatorId = body.creator_id ? cleanHeaderValue(body.creator_id, 64) : "";
  const creatorUrl = validatedCreatorUrl(body.creator_url);

  const creatorBlock = creatorUsername
    ? `
    <hr style="border:none;border-top:1px solid #ddd;margin:20px 0;" />
    <h3 style="font-family:Arial,sans-serif;">Creator-Anfrage</h3>
    <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
      <tr><td style="padding:6px 12px;color:#888;width:140px;">Creator</td><td style="padding:6px 12px;"><strong>${escapeHtml(creatorDisplay || creatorUsername)}</strong></td></tr>
      <tr><td style="padding:6px 12px;color:#888;">Username</td><td style="padding:6px 12px;font-family:monospace;">@${escapeHtml(creatorUsername)}</td></tr>
      ${creatorId ? `<tr><td style="padding:6px 12px;color:#888;">Profile-ID</td><td style="padding:6px 12px;font-family:monospace;font-size:11px;">${escapeHtml(creatorId)}</td></tr>` : ""}
      ${creatorUrl ? `<tr><td style="padding:6px 12px;color:#888;">URL</td><td style="padding:6px 12px;"><a href="${escapeHtml(creatorUrl)}">${escapeHtml(creatorUrl)}</a></td></tr>` : ""}
    </table>
  `
    : "";

  const html = `
    <h2>Neue Kooperationsanfrage über zoe-star.de</h2>
    <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
      <tr><td style="padding:6px 12px;color:#888;width:140px;">Name</td><td style="padding:6px 12px;"><strong>${escapeHtml(fullName)}</strong></td></tr>
      <tr><td style="padding:6px 12px;color:#888;">Firma</td><td style="padding:6px 12px;"><strong>${escapeHtml(body.company)}</strong></td></tr>
      ${body.position ? `<tr><td style="padding:6px 12px;color:#888;">Position</td><td style="padding:6px 12px;">${escapeHtml(body.position)}</td></tr>` : ""}
      <tr><td style="padding:6px 12px;color:#888;">E-Mail</td><td style="padding:6px 12px;"><a href="mailto:${escapeHtml(body.email)}">${escapeHtml(body.email)}</a></td></tr>
      ${body.phone ? `<tr><td style="padding:6px 12px;color:#888;">Telefon</td><td style="padding:6px 12px;">${escapeHtml(body.phone)}</td></tr>` : ""}
      <tr><td style="padding:6px 12px;color:#888;">Art</td><td style="padding:6px 12px;"><strong>${escapeHtml(typeLabel)}</strong></td></tr>
      ${body.budget ? `<tr><td style="padding:6px 12px;color:#888;">Budget</td><td style="padding:6px 12px;">${escapeHtml(body.budget)}</td></tr>` : ""}
      <tr><td style="padding:6px 12px;color:#888;">IP</td><td style="padding:6px 12px;font-family:monospace;font-size:11px;">${escapeHtml(ip)}</td></tr>
    </table>
    ${creatorBlock}
    <hr style="border:none;border-top:1px solid #ddd;margin:20px 0;" />
    <h3 style="font-family:Arial,sans-serif;">Nachricht</h3>
    <p style="white-space:pre-wrap;font-family:Arial,sans-serif;line-height:1.6;font-size:14px;">${escapeHtml(body.message)}</p>
  `;

  const safeCompany = cleanHeaderValue(body.company);
  const subject = creatorUsername
    ? `[Kooperation · @${creatorUsername}] ${typeLabel} — ${safeCompany}`
    : `[Kooperation] ${typeLabel} — ${safeCompany}`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: TARGET_EMAIL,
      reply_to: body.email,
      subject,
      html,
    }),
  });

  if (!r.ok) {
    return NextResponse.json(
      { error: "Versand fehlgeschlagen. Bitte direkt an info@zoe-star.de schreiben." },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true });
}
