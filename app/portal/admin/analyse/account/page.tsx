import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { TriggerButton } from "../TriggerButton";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  submitted: "Eingereicht",
  queued: "Warteschlange",
  processing: "Wird analysiert",
  done: "Fertig",
  failed: "Fehler",
  reviewed: "Geprueft",
  in_review: "In Pruefung",
};

const STATUS_TONE: Record<string, string> = {
  submitted: "border border-champagne/40 text-champagne",
  queued: "border border-champagne/30 text-champagne/85",
  processing: "border border-champagne/60 text-champagne",
  done: "bg-champagne text-ink",
  failed: "border border-red-400/40 text-red-300/85",
  reviewed: "bg-champagne text-ink",
  in_review: "border border-champagne/40 text-champagne",
};

export default async function AdminAccountAnalyseQueue() {
  const { supabase, profile } = await requireAdmin();

  const { data: rows } = await supabase
    .from("account_analyses")
    .select("id, profile_id, target_tiktok_username, status, manual_note, created_at, cost_usd, ai_provider, ai_model")
    .order("created_at", { ascending: false })
    .limit(200);

  const ids = Array.from(new Set((rows ?? []).map((r) => r.profile_id)));
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("id, display_name, tiktok_username").in("id", ids)
    : { data: [] };
  const map = new Map((profiles ?? []).map((p) => [p.id, p]));

  const enriched = (rows ?? []).map((r) => ({
    ...r,
    creator_name: map.get(r.profile_id)?.display_name ?? null,
    creator_tiktok: map.get(r.profile_id)?.tiktok_username ?? null,
  }));

  const totalCost = enriched.reduce((s, r) => s + Number(r.cost_usd ?? 0), 0);
  const open = enriched.filter((r) => ["submitted", "queued", "processing"].includes(r.status)).length;
  const done = enriched.filter((r) => ["done", "reviewed"].includes(r.status)).length;

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
        <p className="eyebrow mb-4">Admin · Analyse</p>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          Account Analyse <span className="text-champagne">Queue.</span>
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-12 max-w-2xl">
          Web-Modul-Version des frueheren ZOE-App /zoestart. Eingereichte
          Profil-Analysen mit Cost-Tracking + Status.
        </p>

        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-10 md:mb-14">
          <Count label="Offen" value={open.toString()} highlight={open > 0} />
          <Count label="Fertig" value={done.toString()} />
          <Count label="Kosten USD" value={totalCost.toFixed(2)} />
        </div>

        {enriched.length === 0 && (
          <p className="text-cream/45 italic font-display text-lg">Noch keine Analysen.</p>
        )}

        <ul className="space-y-3">
          {enriched.map((r) => (
            <li key={r.id} className="border border-champagne/15 p-4 md:p-5">
              <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
                <p className="font-display italic text-cream text-lg md:text-xl">
                  {r.creator_name || r.creator_tiktok || "—"}{" "}
                  {r.creator_tiktok && (
                    <span className="text-cream/45 text-sm">@{r.creator_tiktok}</span>
                  )}
                </p>
                <span className={`shrink-0 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] ${STATUS_TONE[r.status] ?? ""}`}>
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
              </div>
              <p className="text-cream/55 text-[11px] uppercase tracking-[0.22em] mb-2">
                Target: @{r.target_tiktok_username}
              </p>
              {r.manual_note && (
                <p className="text-cream/55 text-sm italic mb-2">„{r.manual_note}"</p>
              )}
              <div className="flex items-center justify-between gap-3 flex-wrap text-[10px] uppercase tracking-[0.25em]">
                <span className="text-cream/35">
                  {new Date(r.created_at).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
                  {r.ai_provider && <> · {r.ai_provider}</>}
                  {r.ai_model && <> · {r.ai_model}</>}
                  {r.cost_usd && Number(r.cost_usd) > 0 && <> · ${Number(r.cost_usd).toFixed(4)}</>}
                </span>
                <div className="flex items-center gap-3">
                  <TriggerButton
                    id={r.id}
                    kind="account"
                    disabled={["done", "reviewed"].includes(r.status)}
                  />
                  <Link
                    href={`/portal/admin/analyse/account/${r.id}`}
                    className="text-champagne hover:text-champagne-300"
                  >
                    Oeffnen →
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

function Count({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`border p-5 md:p-6 ${highlight ? "border-champagne bg-champagne/5" : "border-champagne/15"}`}>
      <p className="text-cream/45 text-[10px] uppercase tracking-[0.25em] mb-3">{label}</p>
      <p className={`font-display italic font-black text-4xl md:text-5xl leading-none ${highlight ? "text-champagne" : "text-cream"}`}>
        {value}
      </p>
    </div>
  );
}
