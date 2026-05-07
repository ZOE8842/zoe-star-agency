// Admin-API: Invite-Code erstellen UND Onboarding-Mail in einem Schritt versenden.
// Auth: nur role=admin. Resend-basiert. Insert via Service-Role (umgeht RLS).

import { NextRequest, NextResponse } from "next/server";
import { createClient as createSsrClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { buildInviteMail } from "@/lib/mail/onboarding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  email: string;
  intended_role: "creator" | "manager";
  expires_in_days?: number;
  recipient_name?: string;
  personal_note?: string;
  code?: string;
}

const FROM_EMAIL = "ZOE Star Agency <noreply@zoe-star.de>";
const REPLY_TO = "info@zoe-star.de";

function generateCode(): string {
  const year = new Date().getFullYear();
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let rand = "";
  for (let i = 0; i < 6; i++) {
    rand += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `ZOE-${year}-${rand}`;
}

export async function POST(req: NextRequest) {
  // 1) Caller-Auth: muss eingeloggter Admin sein
  const ssr = await createSsrClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  const { data: callerProfile } = await ssr
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!callerProfile || callerProfile.role !== "admin") {
    return NextResponse.json({ error: "Nur Admin." }, { status: 403 });
  }

  // 2) Body parsen + validieren
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const role = body.intended_role;
  const expiresInDays = typeof body.expires_in_days === "number" ? body.expires_in_days : 30;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Ungueltige Email-Adresse." }, { status: 400 });
  }
  if (role !== "creator" && role !== "manager") {
    return NextResponse.json({ error: "intended_role muss creator oder manager sein." }, { status: 400 });
  }
  if (expiresInDays < 0 || expiresInDays > 365) {
    return NextResponse.json({ error: "expires_in_days muss zwischen 0 und 365 liegen." }, { status: 400 });
  }
  if (body.personal_note && body.personal_note.length > 800) {
    return NextResponse.json({ error: "Persoenliche Notiz zu lang (max 800 Zeichen)." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!apiKey || !serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "Mail-/DB-Service nicht konfiguriert." }, { status: 500 });
  }

  // 3) Code festlegen (Override moeglich, sonst auto)
  const code = (body.code?.trim().toUpperCase()) || generateCode();
  if (!/^[A-Z0-9-]{6,40}$/.test(code)) {
    return NextResponse.json({ error: "Code-Format ungueltig." }, { status: 400 });
  }

  const expires_at = expiresInDays > 0
    ? new Date(Date.now() + expiresInDays * 24 * 3600 * 1000).toISOString()
    : null;

  // 4) Invite via Service-Role einfuegen
  const admin = createAdminClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: invite, error: insertErr } = await admin
    .from("invites")
    .insert({
      code,
      created_by: callerProfile.id,
      intended_role: role,
      expires_at,
    })
    .select("id, code, expires_at, intended_role")
    .single();

  if (insertErr || !invite) {
    const dup = insertErr?.message?.toLowerCase().includes("duplicate");
    return NextResponse.json(
      { error: dup ? "Code existiert bereits, bitte neu generieren." : `Invite-Insert fehlgeschlagen: ${insertErr?.message}` },
      { status: dup ? 409 : 500 },
    );
  }

  // 5) Mail bauen + versenden
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zoe-star.de";
  const { subject, html, text } = buildInviteMail({
    inviteCode: invite.code,
    intendedRole: role,
    recipientName: body.recipient_name,
    recipientEmail: email,
    expiresAt: invite.expires_at,
    personalNote: body.personal_note,
    siteUrl,
  });

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: email,
      reply_to: REPLY_TO,
      subject,
      html,
      text,
    }),
  });

  if (!resendRes.ok) {
    const errText = await resendRes.text().catch(() => "");
    // Cleanup: Invite wieder loeschen, damit Admin neu probieren kann
    await admin.from("invites").delete().eq("id", invite.id);
    return NextResponse.json(
      { error: `Mail-Versand fehlgeschlagen (Code zurueckgesetzt): ${errText.slice(0, 200)}` },
      { status: 502 },
    );
  }

  const resendData = await resendRes.json().catch(() => ({}));

  return NextResponse.json({
    success: true,
    code: invite.code,
    invite_id: invite.id,
    email_id: resendData.id || null,
    signup_url: `${siteUrl}/portal/signup?invite=${encodeURIComponent(invite.code)}`,
  });
}
