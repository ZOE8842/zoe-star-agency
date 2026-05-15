// Sync-Auth-Helper fuer externe Push-Endpoints (Backstage-Metrics-Sync etc.).
// Pattern analog zu lib/security/cron-auth.ts: fail-CLOSED ohne Env-Var.
//
// Verwendung im Endpoint:
//   const authResp = checkSyncAuth(request);
//   if (authResp) return authResp;
//
// Workstation/Push-Client schickt:
//   Authorization: Bearer <BACKSTAGE_SYNC_BEARER>
//
// Bearer-Vergleich nutzt timingSafeEqual aus crypto, um Timing-Side-Channels
// beim Secret-Compare auszuschliessen (Codex-P3-Hint).

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

export function checkSyncAuth(request: NextRequest): NextResponse | null {
  const secret = process.env.BACKSTAGE_SYNC_BEARER;
  const header = request.headers.get("authorization");

  if (!secret) {
    return NextResponse.json(
      { error: "BACKSTAGE_SYNC_BEARER not configured on server." },
      { status: 503 },
    );
  }
  if (!header || !header.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const provided = header.slice(7);
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
