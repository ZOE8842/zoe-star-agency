// Audit-Log Helper. Fire-and-forget — Mutation-Action soll nie scheitern
// wegen Log-Failure. Verwendung:
//   await writeAudit({ actorId, actorRole, action: "event.create",
//                      targetTable: "events", targetId: data.id, payload: {...} });
//
// Aufruf am Ende einer erfolgreichen Mutation. Bei Fehler-Pfaden mit
// ok=false + error_msg.

import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export interface AuditEntry {
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  targetTable?: string | null;
  targetId?: string | null;
  payload?: Record<string, unknown>;
  ok?: boolean;
  errorMsg?: string | null;
}

export async function writeAudit(entry: AuditEntry): Promise<void> {
  try {
    const sb = admin();
    await sb.from("audit_logs").insert({
      actor_id: entry.actorId ?? null,
      actor_role: entry.actorRole ?? null,
      action: entry.action,
      target_table: entry.targetTable ?? null,
      target_id: entry.targetId ?? null,
      payload: entry.payload ?? {},
      ok: entry.ok ?? true,
      error_msg: entry.errorMsg ?? null,
    });
  } catch (e) {
    // Log-Failure darf nie zur Mutation-Failure werden.
    console.error("[audit] insert failed:", e);
  }
}
