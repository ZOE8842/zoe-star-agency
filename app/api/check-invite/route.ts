// Pre-Check fuer Invite-Codes · VOR auth.signUp() aufgerufen.
// Verhindert Ghost-User wenn Invite ungueltig/verbraucht/abgelaufen.

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  invite_code: string;
  tiktok_username?: string;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const code = (body.invite_code || "").trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ ok: false, error: "Invite-Code fehlt." }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: invite, error } = await admin
    .from("invites")
    .select("id, intended_role, expires_at, used_at")
    .eq("code", code)
    .maybeSingle();

  if (error || !invite) {
    return NextResponse.json(
      { ok: false, error: "Dieser Einladungscode ist ungueltig. Bitte pruefe die Schreibweise oder fordere einen neuen Code an." },
      { status: 400 },
    );
  }

  if (invite.used_at) {
    return NextResponse.json(
      { ok: false, error: "Dieser Einladungscode wurde bereits verwendet. Bitte fordere einen neuen Code an." },
      { status: 400 },
    );
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json(
      { ok: false, error: "Dieser Einladungscode ist abgelaufen. Bitte fordere einen neuen Code an." },
      { status: 400 },
    );
  }

  // Optional: TikTok-Username-Konflikt vorab pruefen
  if (body.tiktok_username) {
    const u = body.tiktok_username.replace(/^@/, "").trim();
    if (u) {
      const { data: dup } = await admin
        .from("profiles")
        .select("id")
        .eq("tiktok_username", u)
        .maybeSingle();
      if (dup) {
        return NextResponse.json(
          { ok: false, error: "Dieser TikTok-Username ist bereits registriert. Bitte pruefe deine Eingabe." },
          { status: 400 },
        );
      }
    }
  }

  return NextResponse.json({ ok: true, intended_role: invite.intended_role });
}
