import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { BigMatchForm } from "./BigMatchForm";

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

export default async function BigMatchPage() {
  const { supabase, profile } = await getAuthedProfile();

  const { data: rows } = await supabase
    .from("match_requests")
    .select(
      "id, status, desired_date, desired_time, own_level, match_type, desired_opponent_level, goal, language, country, message, scheduled_for, created_at, updated_at",
    )
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(20);
  const list = rows ?? [];
  const open = list.filter((r) => ["requested", "in_review", "partner_found"].includes(r.status));

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        tiktokUsername={profile.tiktok_username}
        avatarUrl={profile.avatar_url}
        isAdmin={profile.role === "admin"}
        isManager={profile.role === "manager"}
      />

      <div className="atelier-atmosphere" />
      <div className="atelier-grain" />

      <main className="container-luxe relative z-10 py-12 md:py-16 max-w-2xl">
        <div className="mb-10">
          <Link
            href="/portal/services"
            className="text-cream/45 hover:text-champagne text-[11px] uppercase tracking-[0.25em] inline-flex items-center"
          >
            ← Services
          </Link>
        </div>

        <p className="eyebrow mb-3">Big Match</p>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          ZOE organisiert starke <span className="text-champagne">Matches.</span>
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-10 max-w-xl">
          Wir suchen Matches, die zu deinem LIVE wirklich passen. Du
          gibst uns Datum, dein Level und dein Ziel — wir kuemmern uns
          um den Gegner.
        </p>

        <BigMatchForm blocked={open.length >= 2} />

        {list.length > 0 && (
          <section className="mt-12">
            <p className="eyebrow mb-4">Deine Anfragen</p>
            <ul className="space-y-3">
              {list.map((r) => (
                <li key={r.id} className="border border-champagne/15 p-4 md:p-5">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
                    <p className="font-display italic text-cream text-lg">
                      {r.match_type} · {r.own_level}
                    </p>
                    <span className={`shrink-0 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] ${STATUS_TONE[r.status] ?? ""}`}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </div>
                  <p className="text-cream/55 text-[11px] uppercase tracking-[0.22em] mb-2">
                    {r.desired_date ? new Date(r.desired_date).toLocaleDateString("de-DE") : "Datum offen"}
                    {r.desired_time && <> · {r.desired_time}</>}
                    {r.goal && <> · Ziel: {r.goal}</>}
                    {r.desired_opponent_level && <> · Gegner: {r.desired_opponent_level}</>}
                  </p>
                  {r.scheduled_for && r.status === "scheduled" && (
                    <p className="text-champagne text-sm mb-2">
                      Geplant fuer {new Date(r.scheduled_for).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  )}
                  {r.message && (
                    <p className="text-cream/55 text-sm italic mb-2">„{r.message}"</p>
                  )}
                  <p className="text-cream/35 text-[10px] uppercase tracking-[0.25em]">
                    Eingereicht {new Date(r.created_at).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-cream/35 text-xs mt-12 leading-relaxed">
          Big Match ist agencygefuehrt. Keine offene Liste, keine
          automatische Zuweisung — ZOE entscheidet welcher Gegner zu
          deinem Profil und deinen Zielen passt.
        </p>
      </main>
    </>
  );
}
