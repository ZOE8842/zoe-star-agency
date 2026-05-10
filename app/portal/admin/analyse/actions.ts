"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSrClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { processAccountAnalysis, processLiveReport } from "@/lib/analyse/worker";

// Admin-Action: triggert eine einzelne Analyse manuell.
// Nutzt Service-Role-Client damit das Update + die Notification ohne
// User-Session laufen, aber: Auth wird ueber requireAdmin() gegen den
// eingeloggten Admin geprueft, bevor wir den Worker starten.
export async function adminTriggerAnalysis(input: {
  id: string;
  kind: "account" | "live";
}): Promise<{ ok: boolean; error?: string; cost_usd?: number }> {
  await requireAdmin();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: "SERVICE_ROLE_KEY fehlt im Backend." };
  }

  const sr = createSrClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const r =
    input.kind === "account"
      ? await processAccountAnalysis(sr, input.id)
      : await processLiveReport(sr, input.id);

  revalidatePath(`/portal/admin/analyse/${input.kind}`);
  revalidatePath(`/portal/analyse/${input.kind}/${input.id}`);

  return { ok: r.ok, error: r.error, cost_usd: r.cost_usd };
}
