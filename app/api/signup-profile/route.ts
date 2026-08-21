// Server-Side Signup-Profile-Creation
// Workaround für Email-Confirm-Mode: signUp() gibt user zurück OHNE Session
// → auth.uid() ist null in RPC → Profile-Insert failt
// Lösung: Server-API mit Service-Role legt Profile direkt an, bypasst RLS,
// braucht auth.uid() nicht.

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  user_id: string;
  email: string;
  invite_code: string;
  tiktok_username: string;
  display_name: string;
  country: string;
  language: string;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { user_id, email, invite_code: rawInviteCode, tiktok_username, display_name, country, language } = body;

  if (!user_id || !email || !rawInviteCode || !tiktok_username || !display_name) {
    return NextResponse.json({ error: "Pflichtfelder fehlen." }, { status: 400 });
  }

  // Invite-Code normalisieren · gleiche Logik wie /api/check-invite
  // (sonst können Whitespace / Case-Mismatch Signup fehlschlagen lassen
  // OBWOHL pre-check ok war → confused User · ghost auth account)
  const invite_code = String(rawInviteCode).trim().toUpperCase();

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Helper: Reject → Auth-User cleanup (vermeidet Ghost-User wenn
  // signUp() bereits durchgelaufen ist aber Validation hier failt).
  async function rejectAndCleanup(status: number, message: string) {
    await admin.auth.admin.deleteUser(user_id).catch(() => {});
    return NextResponse.json({ error: message }, { status });
  }

  // 1. Verifizieren dass der User wirklich grade angelegt wurde
  const { data: userData, error: userErr } = await admin.auth.admin.getUserById(user_id);
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: "User nicht gefunden. Bitte neu registrieren." }, { status: 400 });
  }

  // Email-Match-Check — Schutz gegen ID-Forgery.
  // Supabase normalisiert auth.users.email auf lowercase → wir vergleichen
  // case-insensitive damit Nutzer mit Gross-/Klein-Mischung nicht blocken.
  if ((userData.user.email || "").toLowerCase() !== email.toLowerCase()) {
    return rejectAndCleanup(400, "Email stimmt nicht mit Account überein.");
  }

  // 2. Invite holen + validieren · cleanup bei jedem reject
  const { data: invite, error: inviteErr } = await admin
    .from("invites")
    .select("id, intended_role, expires_at, used_at, skip_onboarding")
    .eq("code", invite_code)
    .maybeSingle();

  if (inviteErr || !invite) {
    return rejectAndCleanup(400, "Dieser Einladungscode ist ungueltig. Bitte fordere einen neuen Code an.");
  }

  if (invite.used_at) {
    return rejectAndCleanup(400, "Dieser Einladungscode wurde bereits verwendet. Bitte fordere einen neuen Code an.");
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return rejectAndCleanup(400, "Dieser Einladungscode ist abgelaufen. Bitte fordere einen neuen Code an.");
  }

  // 3. Prüfen ob TikTok-Username schon vergeben (UNIQUE-Constraint, aber friendly error)
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("tiktok_username", tiktok_username)
    .maybeSingle();

  if (existing) {
    return rejectAndCleanup(400, "Dieser TikTok-Username ist bereits registriert.");
  }

  // 4. Profile anlegen
  // V2-A: Creator starten in 'pending' — Admin muss nach Onboarding approven.
  // Admin/Manager-Invites werden sofort 'active' (Operations-Rollen).
  // Email wird lowercased gespeichert (konsistent mit auth.users).
  //
  // Ausnahme: Invites mit skip_onboarding. Gedacht fuer Partner- und
  // Gastzugaenge (z.B. TikTok-Ansprechpartner), die das Portal ansehen
  // sollen, ohne Onboarding-Strecke und ohne dass jemand erst freigibt.
  const sofortAktiv =
    invite.skip_onboarding === true || invite.intended_role !== "creator";
  const initialStatus = sofortAktiv ? "active" : "pending";
  const { error: profErr } = await admin.from("profiles").insert({
    id: user_id,
    email: email.toLowerCase(),
    tiktok_username,
    display_name,
    role: invite.intended_role,
    status: initialStatus,
    country,
    language,
    ...(invite.skip_onboarding === true
      ? {
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        }
      : {}),
  });

  if (profErr) {
    // Falls Profile-Insert failt: User-Cleanup (sonst dangling auth-user ohne profile)
    await admin.auth.admin.deleteUser(user_id).catch(() => {});
    return NextResponse.json({ error: `Profile konnte nicht angelegt werden: ${profErr.message}` }, { status: 500 });
  }

  // 5. Invite als used markieren
  await admin
    .from("invites")
    .update({ used_at: new Date().toISOString(), used_by: user_id })
    .eq("id", invite.id);

  // 6. Dashboard-News fuer creator_joined (14 Tage sichtbar) — best-effort
  if (invite.intended_role === "creator" && invite.skip_onboarding !== true) {
    const tiktokUrl = `https://www.tiktok.com/@${tiktok_username.replace(/^@/, "")}`;
    const visibleUntil = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();
    await admin.from("dashboard_news").insert({
      type: "creator_joined",
      title: `⭐ ${display_name} ist neu bei ZOE Star Agency`,
      body: "Folgt ihr gerne auf TikTok.",
      profile_id: user_id,
      tiktok_username,
      tiktok_url: tiktokUrl,
      visible_until: visibleUntil,
      dedupe_key: `creator_joined:${user_id}`,
    }).then(() => undefined, () => undefined);
  }

  return NextResponse.json({ success: true, role: invite.intended_role });
}
