// Event-Cover-Upload — Admin-only (requireAdmin).
// Path: event-covers/<timestamp>-<rand>.<ext>
// POST mit multipart/form-data, file-Field. Antwort: { success, url }.

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 8 * 1024 * 1024; // 8 MB reichen fuer Cover (3000x1300 jpg)
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  // Admin-Gate. Bei fehlendem Recht: redirect → kommt als 307/302 im Client.
  await requireAdmin();

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Kein File uebergeben." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Datei zu gross. Max 8 MB." }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: "Nur JPEG, PNG oder WebP erlaubt." }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const rand = Math.random().toString(36).slice(2, 10);
  const path = `${Date.now()}-${rand}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadErr } = await admin.storage
    .from("event-covers")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
      cacheControl: "3600",
    });

  if (uploadErr) {
    return NextResponse.json({ error: `Upload-Fehler: ${uploadErr.message}` }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage.from("event-covers").getPublicUrl(path);
  return NextResponse.json({ success: true, url: publicUrl });
}
