// Cron-Auth-Helper. Fail-CLOSED: ohne CRON_SECRET in der Umgebung wird
// kein Endpoint freigegeben. Verhindert oeffentliche Trigger der
// Service-Role-Cronjobs wenn die Env-Var versehentlich nicht gesetzt ist.
//
// Bearer-Vergleich nutzt timingSafeEqual aus crypto (gleiches Muster wie
// lib/security/sync-auth.ts), damit die Antwortzeit nichts ueber den
// Secret-Inhalt verraet.

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

export function checkCronAuth(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");

  // Fail-closed: kein Secret konfiguriert → kein Zugriff.
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured on server." },
      { status: 503 },
    );
  }
  if (!header || !header.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const a = Buffer.from(header.slice(7));
  const b = Buffer.from(secret);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
