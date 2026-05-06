// Kontaktformular-API: Resend → info@zoe-star.de
// Honeypot-Feld + In-Memory-Rate-Limit pro IP (10/h)

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  name: string;
  email: string;
  tiktok?: string;
  topic: string;
  message: string;
  company?: string; // Honeypot
}

const TARGET_EMAIL = "info@zoe-star.de";
const FROM_EMAIL = "ZOE Star Agency <noreply@zoe-star.de>";

// Naive In-Memory-Rate-Limit (1 Server-Instance, reset bei Cold-Start)
const rateMap = new Map<string, { count: number; reset: number }>();
const HOUR = 60 * 60 * 1000;
const LIMIT = 10;

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

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot: wenn Bot das Feld ausgefüllt hat → still drop
  if (body.company && body.company.length > 0) {
    return NextResponse.json({ success: true }); // Lie: Bot soll glauben es klappt
  }

  // Validation
  if (!body.name || !body.email || !body.topic || !body.message) {
    return NextResponse.json({ error: "Pflichtfelder fehlen." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return NextResponse.json({ error: "Ungültige Email-Adresse." }, { status: 400 });
  }
  if (body.message.length < 10 || body.message.length > 2000) {
    return NextResponse.json({ error: "Nachricht zu kurz oder zu lang." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Mail-Service nicht konfiguriert." }, { status: 500 });
  }

  const topicLabel: Record<string, string> = {
    creator: "Creator-Anfrage",
    brand: "Brand-Kooperation",
    press: "Presse / Media",
    support: "Support / Fragen",
    other: "Sonstiges",
  };

  const html = `
    <h2>Neue Kontaktanfrage über zoe-star.de</h2>
    <table style="border-collapse:collapse;font-family:Arial,sans-serif;">
      <tr><td style="padding:6px 12px;color:#888;">Name</td><td style="padding:6px 12px;"><strong>${escapeHtml(body.name)}</strong></td></tr>
      <tr><td style="padding:6px 12px;color:#888;">Email</td><td style="padding:6px 12px;"><a href="mailto:${escapeHtml(body.email)}">${escapeHtml(body.email)}</a></td></tr>
      ${body.tiktok ? `<tr><td style="padding:6px 12px;color:#888;">TikTok</td><td style="padding:6px 12px;">@${escapeHtml(body.tiktok)}</td></tr>` : ""}
      <tr><td style="padding:6px 12px;color:#888;">Anliegen</td><td style="padding:6px 12px;">${escapeHtml(topicLabel[body.topic] || body.topic)}</td></tr>
      <tr><td style="padding:6px 12px;color:#888;">IP</td><td style="padding:6px 12px;font-family:monospace;font-size:11px;">${escapeHtml(ip)}</td></tr>
    </table>
    <hr style="border:none;border-top:1px solid #ddd;margin:20px 0;" />
    <h3>Nachricht</h3>
    <p style="white-space:pre-wrap;font-family:Arial,sans-serif;line-height:1.6;">${escapeHtml(body.message)}</p>
  `;

  const subject = `[Kontakt] ${topicLabel[body.topic] || body.topic} — ${body.name}`;

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
    const err = await r.text();
    return NextResponse.json(
      { error: "Mail-Versand fehlgeschlagen. Bitte direkt an info@zoe-star.de schreiben." },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true });
}
