// Admin-Detail-Sicht fuer eine Account-Analyse.
//
// Existenzgrund (HOTFIX B · 2026-05-20):
// Vorher linkte /portal/admin/analyse/account/page.tsx auf
// /portal/analyse/account/<id> (Creator-Detail). Die Creator-Detail-Page
// filtert hart auf profile_id = auth.user.id. Beim Admin-Klick aus der
// Admin-Liste matched dieser Filter nie → notFound → 404 systemweit
// fuer alle Analysen.
//
// Diese Admin-Detail-Page:
//   - liest mit requireAdmin (KEIN Manager-Bypass)
//   - laedt account_analyses-Row OHNE profile_id-Filter
//   - laedt zusaetzlich den Creator-Header (display_name, tiktok_username)
//   - hat Back-Link zur Admin-Queue
//   - rendert UI identisch zur Creator-Detail-Page

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

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

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminAccountAnalyseDetail({ params }: Props) {
  const { id } = await params;
  const { supabase, profile } = await requireAdmin();

  // Admin-Sicht: KEIN profile_id-Filter. Volle Row inkl. raw_response.
  const { data: row } = await supabase
    .from("account_analyses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!row) notFound();

  // Creator-Header (display_name, tiktok_username) zum Kontext.
  const { data: creator } = await supabase
    .from("profiles")
    .select("display_name, tiktok_username")
    .eq("id", row.profile_id)
    .maybeSingle();

  const scores = (row.scores as Record<string, number | string> | null) ?? null;
  const summary = (row.summary as Record<string, string> | null) ?? null;
  // CDX-1 HOTFIX B: defensive Array-Guards. Legacy / malformed JSONB-Rows
  // koennten beim direkten Cast .map() zur Runtime werfen.
  const recs = Array.isArray(row.recommendations)
    ? (row.recommendations as Array<{ title?: string; body?: string }>)
    : [];
  const imgSuggestions = Array.isArray(row.image_suggestions)
    ? (row.image_suggestions as Array<{ url?: string; note?: string }>)
    : [];
  const raw = (row.raw_response as { sources?: Array<{ name: string; ok: boolean; detail?: string }>; tiktok_source?: string } | null) ?? null;
  const sources = Array.isArray(raw?.sources) ? raw.sources : [];

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        tiktokUsername={profile.tiktok_username}
        avatarUrl={profile.avatar_url}
        isAdmin
      />

      <div className="atelier-atmosphere" />
      <div className="atelier-grain" />

      <main className="container-luxe relative z-10 py-12 md:py-16 max-w-2xl">
        <div className="mb-10">
          <Link
            href="/portal/admin/analyse/account"
            className="text-cream/45 hover:text-champagne text-[11px] uppercase tracking-[0.25em] inline-flex items-center"
          >
            ← Admin · Account Analyse Queue
          </Link>
        </div>

        <p className="eyebrow mb-3 text-champagne">Admin-Ansicht · Account-Analyse</p>
        <h1 className="font-display italic text-cream text-3xl md:text-4xl leading-[1.05] tracking-[-0.02em] mb-2">
          @{row.target_tiktok_username}
        </h1>
        {creator && (
          <p className="text-cream/55 text-sm mb-6">
            Creator:{" "}
            <span className="text-cream/80">
              {creator.display_name ?? "—"}
              {creator.tiktok_username && (
                <span className="text-cream/45"> · @{creator.tiktok_username}</span>
              )}
            </span>
          </p>
        )}

        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <span className={`px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] ${STATUS_TONE[row.status] ?? ""}`}>
            {STATUS_LABEL[row.status] ?? row.status}
          </span>
          <span className="text-cream/45 text-xs">
            Gestartet {new Date(row.created_at).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
          </span>
        </div>

        {row.manual_note && (
          <div className="border-l-2 border-champagne/40 pl-4 mb-6">
            <p className="text-cream/55 text-[10px] uppercase tracking-[0.25em] mb-1">Hinweis des Creators</p>
            <p className="text-cream/80 italic">„{row.manual_note}"</p>
          </div>
        )}

        {(row.status === "submitted" || row.status === "queued" || row.status === "processing") && (
          <div className="border border-champagne/15 p-5 md:p-7 mb-6">
            <p className="font-display italic text-cream text-xl mb-2">In Pruefung.</p>
            <p className="text-cream/65 text-sm leading-relaxed">
              Diese Analyse wurde gestartet und laeuft. Sobald der Worker
              fertig ist, erscheinen Scores, Zusammenfassung und Empfehlungen.
            </p>
          </div>
        )}

        {row.status === "failed" && row.error_message && (
          <div className="border border-red-400/40 bg-red-400/5 p-5 mb-6">
            <p className="eyebrow text-red-300 mb-2">Fehler</p>
            <p className="text-red-300/85 text-sm">{row.error_message}</p>
          </div>
        )}

        {(row.status === "done" || row.status === "reviewed") && (
          <>
            {scores && Object.keys(scores).length > 0 && (
              <section className="mb-6">
                <p className="eyebrow mb-3">Bewertung</p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(scores).map(([k, v]) => (
                    <div key={k} className="border border-champagne/20 p-4">
                      <p className="text-cream/45 text-[10px] uppercase tracking-[0.25em] mb-2">{k}</p>
                      <p className="font-display italic font-black text-champagne text-3xl leading-none">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {summary && Object.keys(summary).length > 0 && (
              <section className="mb-6 border border-champagne/30 bg-champagne/5 p-5 md:p-7">
                <p className="eyebrow text-champagne mb-3">Zusammenfassung</p>
                <div className="space-y-3">
                  {Object.entries(summary).map(([k, v]) => (
                    <div key={k}>
                      <p className="text-cream/55 text-[10px] uppercase tracking-[0.25em] mb-1">{k}</p>
                      <p className="text-cream text-sm leading-relaxed">{v}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {recs.length > 0 && (
              <section className="mb-6">
                <p className="eyebrow mb-3">Konkrete Schritte</p>
                <ul className="space-y-3">
                  {recs.map((r, i) => (
                    <li key={i} className="border border-champagne/15 p-4">
                      <p className="font-display italic text-cream text-lg mb-1">
                        {i + 1}. {r.title || "Empfehlung"}
                      </p>
                      {r.body && (
                        <p className="text-cream/70 text-sm leading-relaxed">{r.body}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {imgSuggestions.length > 0 && (
              <section className="mb-6">
                <p className="eyebrow mb-3">Bild-Vorschlaege</p>
                <div className="grid grid-cols-2 gap-3">
                  {imgSuggestions.map((img, i) =>
                    img.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <div key={i} className="border border-champagne/15 p-2">
                        <img src={img.url} alt="" loading="lazy" className="w-full aspect-square object-cover mb-2" />
                        {img.note && <p className="text-cream/55 text-xs">{img.note}</p>}
                      </div>
                    ) : null,
                  )}
                </div>
              </section>
            )}

            {sources.length > 0 && (
              <section className="mt-8 mb-4 border-t border-champagne/10 pt-5">
                <p className="eyebrow text-cream/40 mb-3">Datenquellen</p>
                <ul className="space-y-1">
                  {sources.map((s, i) => (
                    <li key={i} className="text-cream/50 text-[10px] uppercase tracking-[0.25em] flex items-center gap-2">
                      <span className={s.ok ? "text-champagne" : "text-red-300/70"}>
                        {s.ok ? "✓" : "·"}
                      </span>
                      <span>{s.name.replace(/_/g, " ")}</span>
                      {s.detail && <span className="text-cream/30 normal-case tracking-normal">— {s.detail}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {row.ai_provider && (
              <p className="text-cream/35 text-[10px] uppercase tracking-[0.25em]">
                Analysiert via {row.ai_provider}
                {row.ai_model && <> · {row.ai_model}</>}
                {row.completed_at && (
                  <> · {new Date(row.completed_at).toLocaleDateString("de-DE")}</>
                )}
                {row.cost_usd && Number(row.cost_usd) > 0 && (
                  <> · ${Number(row.cost_usd).toFixed(4)}</>
                )}
              </p>
            )}
          </>
        )}
      </main>
    </>
  );
}
