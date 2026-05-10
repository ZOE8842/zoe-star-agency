import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

export const dynamic = "force-dynamic";

const SOURCE_LABEL: Record<string, string> = {
  apify_tiktok: "Apify · TikTok Public",
  backstage_sync: "Backstage · Daily Sync",
  claude_worker: "Claude · Worker",
};

export default async function AdminAnalyseHealth() {
  const { supabase, profile } = await requireAdmin();

  const since24h = new Date(Date.now() - 24 * 3600_000).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();

  const [{ data: rows }, { data: latestPerSource }, { count: snapshotsCount }] = await Promise.all([
    supabase
      .from("data_source_health")
      .select("id, source, kind, ok, count_items, cost_usd, duration_ms, error_message, created_at")
      .gte("created_at", since7d)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("data_source_health")
      .select("source, ok, created_at, error_message, cost_usd")
      .gte("created_at", since24h)
      .order("created_at", { ascending: false })
      .limit(300),
    supabase
      .from("tiktok_public_snapshots")
      .select("id", { count: "exact", head: true })
      .gte("fetched_at", since7d),
  ]);

  const latest = latestPerSource ?? [];
  const byHealth = (key: string) => {
    const entries = latest.filter((r) => r.source === key);
    const last = entries[0];
    const okCount = entries.filter((e) => e.ok).length;
    const total = entries.length;
    const cost = entries.reduce((s, e) => s + Number(e.cost_usd ?? 0), 0);
    return { last, okCount, total, cost };
  };

  const apifyHealth = byHealth("apify_tiktok");
  const workerHealth = byHealth("claude_worker");
  const backstageHealth = byHealth("backstage_sync");

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        tiktokUsername={profile.tiktok_username}
        avatarUrl={profile.avatar_url}
        isAdmin
      />

      <main className="container-luxe py-12 md:py-16">
        <div className="mb-8">
          <Link
            href="/portal/admin"
            className="text-cream/45 hover:text-champagne text-[11px] uppercase tracking-[0.25em] inline-flex items-center"
          >
            ← Admin
          </Link>
        </div>

        <p className="eyebrow mb-4">Admin · Analyse</p>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          Datenquellen-<span className="text-champagne">Health.</span>
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-12 max-w-2xl">
          Letzte 24 h pro Quelle (Apify, Backstage-Sync, Claude-Worker) +
          7-Tage-Verlauf. Fehler werden hier sichtbar bevor Creator
          beschwert.
        </p>

        <div className="grid md:grid-cols-3 gap-3 md:gap-4 mb-12">
          <HealthCard label="Apify · TikTok Public" h={apifyHealth} />
          <HealthCard label="Backstage Daily-Sync" h={backstageHealth} />
          <HealthCard label="Claude Worker" h={workerHealth} />
        </div>

        <div className="grid md:grid-cols-2 gap-3 mb-12">
          <div className="border border-champagne/15 p-5">
            <p className="text-cream/45 text-[10px] uppercase tracking-[0.25em] mb-2">
              TikTok-Snapshots (7 Tage)
            </p>
            <p className="font-display italic font-black text-cream text-3xl">{snapshotsCount ?? 0}</p>
          </div>
          <div className="border border-champagne/15 p-5">
            <p className="text-cream/45 text-[10px] uppercase tracking-[0.25em] mb-2">
              Worker-Kosten (24 h)
            </p>
            <p className="font-display italic font-black text-cream text-3xl">
              ${(workerHealth.cost + apifyHealth.cost).toFixed(4)}
            </p>
          </div>
        </div>

        <section>
          <p className="eyebrow mb-4">Verlauf · letzte 100 Events</p>
          {(rows ?? []).length === 0 && (
            <p className="text-cream/45 italic font-display text-lg">Noch keine Events.</p>
          )}
          <ul className="space-y-2">
            {(rows ?? []).map((r) => (
              <li
                key={r.id}
                className={`border p-3 md:p-4 ${r.ok ? "border-champagne/15" : "border-red-400/40 bg-red-400/5"}`}
              >
                <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                  <p className="text-cream text-sm">
                    <span className="text-cream/45 text-[10px] uppercase tracking-[0.25em] mr-2">
                      {SOURCE_LABEL[r.source] ?? r.source}
                    </span>
                    {r.kind && <span className="text-cream/65">{r.kind}</span>}
                  </p>
                  <span className={`text-[10px] uppercase tracking-[0.25em] ${r.ok ? "text-champagne" : "text-red-300/85"}`}>
                    {r.ok ? "OK" : "FAIL"}
                  </span>
                </div>
                <p className="text-cream/35 text-[10px] uppercase tracking-[0.25em]">
                  {new Date(r.created_at).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
                  {r.duration_ms != null && <> · {r.duration_ms} ms</>}
                  {r.count_items != null && r.count_items > 0 && <> · {r.count_items} items</>}
                  {r.cost_usd && Number(r.cost_usd) > 0 && <> · ${Number(r.cost_usd).toFixed(4)}</>}
                </p>
                {r.error_message && (
                  <p className="text-red-300/80 text-xs mt-2 italic break-all">{r.error_message}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}

function HealthCard({
  label,
  h,
}: {
  label: string;
  h: { last?: { ok: boolean; created_at: string; error_message?: string | null }; okCount: number; total: number; cost: number };
}) {
  const ok = h.last?.ok ?? false;
  const empty = !h.last;
  return (
    <div className={`border p-5 md:p-6 ${empty ? "border-champagne/15" : ok ? "border-champagne/30" : "border-red-400/40 bg-red-400/5"}`}>
      <p className="text-cream/55 text-[10px] uppercase tracking-[0.25em] mb-3">{label}</p>
      {empty ? (
        <p className="text-cream/40 italic font-display text-lg">Noch keine Events (24 h)</p>
      ) : (
        <>
          <p className={`font-display italic font-black text-3xl mb-2 ${ok ? "text-champagne" : "text-red-300/85"}`}>
            {h.okCount}/{h.total}
          </p>
          <p className="text-cream/35 text-[10px] uppercase tracking-[0.25em]">
            Letztes Event: {new Date(h.last!.created_at).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}
          </p>
          {h.cost > 0 && (
            <p className="text-cream/35 text-[10px] uppercase tracking-[0.25em] mt-1">
              Kosten 24 h: ${h.cost.toFixed(4)}
            </p>
          )}
          {!ok && h.last?.error_message && (
            <p className="text-red-300/80 text-xs mt-2 italic break-all">{h.last.error_message}</p>
          )}
        </>
      )}
    </div>
  );
}
