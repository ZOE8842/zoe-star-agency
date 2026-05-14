import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

export const dynamic = "force-dynamic";

function sr() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

interface SearchProps {
  searchParams: Promise<{ action?: string; actor?: string }>;
}

export default async function AuditLogsPage({ searchParams }: SearchProps) {
  const { profile } = await requireAdmin();
  const sp = await searchParams;
  const db = sr();

  let query = db
    .from("audit_logs")
    .select("id, created_at, actor_id, actor_role, action, target_table, target_id, payload, ok, error_msg")
    .order("created_at", { ascending: false })
    .limit(100);

  if (sp.action) query = query.eq("action", sp.action);
  if (sp.actor) query = query.eq("actor_id", sp.actor);

  const [{ data: rows }, { data: profiles }] = await Promise.all([
    query,
    db.from("profiles").select("id, display_name, tiktok_username").limit(500),
  ]);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <>
      <PortalNav userId={profile.id} displayName={profile.display_name}
        avatarUrl={profile.avatar_url} isAdmin />
      <main className="container-luxe py-12 max-w-5xl">
        <p className="eyebrow mb-3">Admin · Audit-Logs</p>
        <h1 className="heading-display text-3xl md:text-4xl mb-2">
          Audit-Trail.
        </h1>
        <p className="text-cream/45 text-xs uppercase tracking-[0.25em] mb-10">
          Letzte 100 Eintraege · Service-Role-Read · Admin-only
        </p>

        {sp.action || sp.actor ? (
          <p className="text-cream/55 text-sm mb-6">
            Filter aktiv:
            {sp.action && <span className="text-champagne ml-2">action={sp.action}</span>}
            {sp.actor && <span className="text-champagne ml-2">actor={sp.actor.slice(0, 8)}</span>}
            <a href="/portal/admin/audit-logs" className="text-cream/45 hover:text-champagne ml-3 text-xs uppercase tracking-[0.25em]">Reset</a>
          </p>
        ) : null}

        <div className="overflow-x-auto border border-champagne/15">
          <table className="text-xs w-full">
            <thead className="bg-champagne/5">
              <tr>
                <th className="text-left p-2 text-cream/55 uppercase tracking-[0.15em] text-[10px] border-b border-champagne/15">When</th>
                <th className="text-left p-2 text-cream/55 uppercase tracking-[0.15em] text-[10px] border-b border-champagne/15">Actor</th>
                <th className="text-left p-2 text-cream/55 uppercase tracking-[0.15em] text-[10px] border-b border-champagne/15">Action</th>
                <th className="text-left p-2 text-cream/55 uppercase tracking-[0.15em] text-[10px] border-b border-champagne/15">Target</th>
                <th className="text-left p-2 text-cream/55 uppercase tracking-[0.15em] text-[10px] border-b border-champagne/15">Payload</th>
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((r) => {
                const actor = r.actor_id ? profileMap.get(r.actor_id) : null;
                const actorLabel = actor?.display_name || (r.actor_id ? r.actor_id.slice(0, 8) : "—");
                return (
                  <tr key={r.id} className="border-b border-cream/[0.05] align-top">
                    <td className="p-2 text-cream/65 font-mono text-[11px] whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "medium" })}
                    </td>
                    <td className="p-2 text-cream/85 text-[11px]">
                      <span className={r.actor_role === "admin" ? "text-champagne" : r.actor_role === "manager" ? "text-cream" : "text-cream/65"}>
                        {actorLabel}
                      </span>
                      {r.actor_role && <span className="text-cream/35 ml-2">{r.actor_role}</span>}
                    </td>
                    <td className="p-2">
                      <a
                        href={`/portal/admin/audit-logs?action=${encodeURIComponent(r.action)}`}
                        className="text-champagne hover:underline font-mono text-[11px]"
                      >
                        {r.action}
                      </a>
                    </td>
                    <td className="p-2 text-cream/65 font-mono text-[10px]">
                      {r.target_table}
                      {r.target_id && <span className="text-cream/35 block">{r.target_id.slice(0, 36)}</span>}
                    </td>
                    <td className="p-2 text-cream/55 font-mono text-[10px] max-w-md">
                      <pre className="whitespace-pre-wrap break-all">{JSON.stringify(r.payload, null, 0).slice(0, 200)}</pre>
                      {!r.ok && r.error_msg && (
                        <p className="text-red-300 mt-1">{r.error_msg}</p>
                      )}
                    </td>
                  </tr>
                );
              })}
              {(rows?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-cream/45">
                    Keine Audit-Eintraege.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
