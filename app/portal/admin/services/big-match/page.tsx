import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { AdminControls } from "./AdminRow";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  requested: "Angefragt",
  in_review: "In Pruefung",
  partner_found: "Partner gefunden",
  scheduled: "Geplant",
  done: "Abgeschlossen",
  rejected: "Abgelehnt",
};

const STATUS_TONE: Record<string, string> = {
  requested: "border border-champagne/40 text-champagne",
  in_review: "border border-champagne/60 text-champagne",
  partner_found: "bg-champagne/20 text-champagne border border-champagne/40",
  scheduled: "bg-champagne text-ink",
  done: "border border-cream/20 text-cream/60",
  rejected: "border border-red-400/40 text-red-300/85",
};

export default async function AdminBigMatchPage() {
  const { supabase, profile } = await requireAdmin();

  const { data: rows } = await supabase
    .from("match_requests")
    .select(
      "id, profile_id, status, admin_note, desired_date, desired_time, own_level, match_type, desired_opponent_level, goal, language, country, message, scheduled_for, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const ids = Array.from(new Set((rows ?? []).map((r) => r.profile_id)));
  const { data: profs } = ids.length
    ? await supabase.from("profiles").select("id, display_name, tiktok_username").in("id", ids)
    : { data: [] };
  const map = new Map((profs ?? []).map((p) => [p.id, p]));

  const enriched = (rows ?? []).map((r) => ({
    ...r,
    creator_name: map.get(r.profile_id)?.display_name ?? null,
    creator_tiktok: map.get(r.profile_id)?.tiktok_username ?? null,
  }));

  const open = enriched.filter((r) => ["requested", "in_review", "partner_found"].includes(r.status)).length;
  const scheduled = enriched.filter((r) => r.status === "scheduled").length;
  const done = enriched.filter((r) => r.status === "done").length;

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
        <p className="eyebrow mb-4">Admin · Services</p>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          Big Match <span className="text-champagne">Queue.</span>
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-12 max-w-2xl">
          Eingereichte Match-Anfragen. Pruefen, Status setzen, geplant.
          Keine automatische Zuweisung — du entscheidest.
        </p>

        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-10 md:mb-14">
          <Count label="Offen" value={open.toString()} highlight={open > 0} />
          <Count label="Geplant" value={scheduled.toString()} />
          <Count label="Abgeschlossen" value={done.toString()} />
        </div>

        {enriched.length === 0 && (
          <p className="text-cream/45 italic font-display text-lg">Noch keine Anfragen.</p>
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
                {r.match_type} · {r.own_level}
                {r.desired_opponent_level && <> · Gegner: {r.desired_opponent_level}</>}
                {r.goal && <> · Ziel: {r.goal}</>}
                {r.language && <> · {r.language}</>}
                {r.country && <> · {r.country}</>}
              </p>
              <p className="text-cream/65 text-sm mb-2">
                {r.desired_date ? new Date(r.desired_date).toLocaleDateString("de-DE") : "Datum offen"}
                {r.desired_time && <> · {r.desired_time}</>}
              </p>
              {r.message && (
                <p className="text-cream/55 text-sm italic mb-2">„{r.message}"</p>
              )}
              <p className="text-cream/35 text-[10px] uppercase tracking-[0.25em]">
                Eingereicht {new Date(r.created_at).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
              </p>

              <AdminControls
                row={{
                  id: r.id,
                  status: r.status,
                  admin_note: r.admin_note,
                  scheduled_for: r.scheduled_for,
                }}
              />
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
