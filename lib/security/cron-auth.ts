// Cron-Auth-Helper. Fail-CLOSED: ohne CRON_SECRET in der Umgebung wird
// kein Endpoint freigegeben. Verhindert oeffentliche Trigger der
// Service-Role-Cronjobs wenn die Env-Var versehentlich nicht gesetzt ist.

import { NextRequest, NextResponse } from "next/server";

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
  if (header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
