// Signed-URL fuer Attachment-Download
// GET ?path=<storage-path> -> { url } (1h gueltig)
// Sicherheit: User muss Empfaenger ODER Sender der Message sein,
// in der dieser Path als Attachment registriert ist.

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  const path = req.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "Pfad fehlt." }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Authorisation: Path muss in einer Message vorkommen, an die der User
  // beteiligt ist (Sender oder Empfaenger oder all_creators).
  const { data: msg } = await admin
    .from("messages")
    .select("id, sender_id, recipient_id, recipient_group, attachments")
    .contains("attachments", [path])
    .limit(1)
    .maybeSingle();

  if (!msg) {
    return NextResponse.json({ error: "Anhang nicht gefunden." }, { status: 404 });
  }

  const allowed =
    msg.sender_id === user.id ||
    msg.recipient_id === user.id ||
    msg.recipient_group === "all_creators";

  if (!allowed) {
    // Admin-Override
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
    }
  }

  const { data: signed, error } = await admin.storage
    .from("message-attachments")
    .createSignedUrl(path, 3600);

  if (error || !signed) {
    return NextResponse.json({ error: "Signed-URL-Fehler." }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
