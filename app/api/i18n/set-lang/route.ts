// POST /api/i18n/set-lang
// Setzt das Public-Locale-Cookie zoe_public_lang.
// Validiert gegen LOCALES-Set. Nicht-authentifizierte Besucher und
// authentifizierte User koennen das Cookie setzen (User-Profile-Sprache
// hat aber Vorrang ueber getEffectiveLocale).
//
// Body: { locale: "de"|"en"|"fr"|"tr"|"pt"|"ar" }

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { PUBLIC_LOCALE_COOKIE } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ONE_YEAR_SEC = 60 * 60 * 24 * 365;

export async function POST(req: NextRequest) {
  let body: { locale?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

  const raw = body?.locale;
  if (!raw || !(LOCALES as readonly string[]).includes(raw)) {
    return NextResponse.json({ error: "invalid_locale" }, { status: 400 });
  }
  const locale = raw as Locale;

  const cookieStore = await cookies();
  cookieStore.set({
    name: PUBLIC_LOCALE_COOKIE,
    value: locale,
    maxAge: ONE_YEAR_SEC,
    path: "/",
    sameSite: "lax",
    httpOnly: false, // damit Client-Side den aktuellen Wert lesen kann
  });

  return NextResponse.json({ success: true, locale });
}
