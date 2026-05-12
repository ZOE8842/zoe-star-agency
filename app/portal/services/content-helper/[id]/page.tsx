import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient as createSrClient } from "@supabase/supabase-js";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { SummaryRenderer } from "@/components/content-helper/SummaryRenderer";
import { AdminTriggerPanel } from "./AdminTriggerPanel";

export const dynamic = "force-dynamic";
// Server Action triggert Worker via after() — braucht Zeit nach Response,
// damit der Hintergrund-Job nicht von Vercel gekillt wird.
export const maxDuration = 60;

const STATUS_LABEL: Record<string, string> = {
  submitted: "Eingereicht",
  queued: "Wartet",
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

const KIND_LABEL: Record<string, string> = {
  video_link: "Video-Link",
  video_file: "Video-Upload",
  image: "Bild",
  profile: "Profil",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ContentHelperDetailPage({ params }: Props) {
  const { id } = await params;
  const { supabase, profile } = await getAuthedProfile();

  // Admin darf alle Reviews sehen · Creator nur eigene
  const isAdmin = profile.role === "admin";
  let q = supabase
    .from("content_reviews")
    .select(
      "id, profile_id, kind, source_url, video_url, video_storage_path, manual_note, status, ai_score, ai_provider, ai_model, cost_usd, error_message, summary, created_at, processing_started_at, reviewed_at",
    )
    .eq("id", id);
  if (!isAdmin) q = q.eq("profile_id", profile.id);

  const { data: job } = await q.maybeSingle();
  if (!job) notFound();

  const aiScore = (job.ai_score as Record<string, unknown> | null) ?? null;
  const summary = (job.summary as Record<string, unknown> | null) ?? null;

  // Hero-Image (nur kind=image): signed URL fuer 1h aus private Bucket holen.
  // Service-Role-Client noetig, weil creator-content private ist.
  let previewUrl: string | null = null;
  if (job.kind === "image" && job.video_storage_path && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const sr = createSrClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const { data: signed } = await sr.storage
      .from("creator-content")
      .createSignedUrl(job.video_storage_path as string, 3600);
    previewUrl = signed?.signedUrl ?? null;
  }

  // Kurzfazit aus ai_score extrahieren (siehe content-prompts.ts Schema)
  const hookScore = aiScore && typeof aiScore.hook_score === "number"
    ? aiScore.hook_score as number
    : aiScore && typeof aiScore.hook_score === "string"
    ? Number(aiScore.hook_score) || null
    : null;
  const strongest = aiScore && Array.isArray(aiScore.strengths) && aiScore.strengths.length > 0
    ? String((aiScore.strengths as unknown[])[0])
    : null;
  const biggestIssue = aiScore && Array.isArray(aiScore.weaknesses) && aiScore.weaknesses.length > 0
    ? String((aiScore.weaknesses as unknown[])[0])
    : null;

  // ai_score-Aufteilung: Listen vs Skalare
  const aiScoreEntries = aiScore ? Object.entries(aiScore) : [];
  const listEntries = aiScoreEntries.filter(([, v]) => Array.isArray(v) && (v as unknown[]).length > 0);
  // hook_score wird oben separat als Kurzfazit gerendert — hier nicht doppeln
  const scalarEntries = aiScoreEntries.filter(([k, v]) => !Array.isArray(v) && k !== "hook_score");

  const uploadedLabel = new Date(job.created_at).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

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
            href="/portal/services/content-helper"
            className="text-cream/45 hover:text-champagne text-[11px] uppercase tracking-[0.25em] inline-flex items-center"
          >
            ← Content Helfer
          </Link>
        </div>

        <p className="eyebrow mb-3">{KIND_LABEL[job.kind] ?? job.kind}</p>
        <h1 className="font-display italic text-cream text-3xl md:text-4xl leading-[1.05] tracking-[-0.02em] mb-4">
          Deine <span className="text-champagne">Anfrage.</span>
        </h1>

        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <span className={`px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] ${STATUS_TONE[job.status] ?? ""}`}>
            {STATUS_LABEL[job.status] ?? job.status}
          </span>
          <span className="text-cream/45 text-xs">
            Eingereicht {new Date(job.created_at).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
          </span>
        </div>

        {/* AdminTriggerPanel ist weiter unten als collapsed <details> eingebaut,
            damit Creator-Flow zuerst Bild + Kurzfazit + Analyse sieht. */}

        {/* HERO IMAGE — Creator sieht zuerst sein Bild.
            Originaldateien sind 5 Tage sichtbar (cleanup via daily cron). */}
        {job.kind === "image" && previewUrl && (
          <div className="mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Eingereichtes Bild"
              className="w-full max-h-[60vh] object-contain border border-champagne/15 bg-ink/40"
            />
            <div className="flex items-baseline justify-between gap-3 mt-2 flex-wrap">
              <p className="text-cream/35 text-[10px] uppercase tracking-[0.25em]">
                Upload vom {uploadedLabel}
              </p>
              {(() => {
                const expiry = new Date(new Date(job.created_at).getTime() + 5 * 24 * 3600 * 1000);
                const remaining = Math.ceil((expiry.getTime() - Date.now()) / (24 * 3600 * 1000));
                if (remaining > 0) {
                  return (
                    <p className="text-cream/35 text-[10px] uppercase tracking-[0.25em]">
                      Sichtbar fuer {remaining} {remaining === 1 ? "Tag" : "Tage"}
                    </p>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        )}

        {/* Original wurde nach 5 Tagen aus Storage entfernt — nur fuer image. */}
        {job.kind === "image" && !previewUrl && !job.video_storage_path && (
          <div className="border border-champagne/15 bg-ink/40 p-6 md:p-8 mb-8 text-center">
            <p className="font-display italic text-cream/45 text-lg md:text-xl mb-2">
              Original entfernt.
            </p>
            <p className="text-cream/35 text-sm">
              Originaldateien werden nach 5 Tagen geloescht. Die Analyse bleibt verfuegbar.
            </p>
          </div>
        )}

        {/* Video/Link-Quellen — nur fuer video_link, NICHT fuer image. */}
        {(job.kind === "video_link" || job.kind === "profile") && (job.source_url || job.video_url) && (
          <div className="border border-champagne/15 p-4 md:p-5 mb-6">
            <p className="eyebrow mb-2">Quelle</p>
            <a
              href={job.source_url || job.video_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-champagne hover:text-champagne-300 text-sm break-all"
            >
              {job.source_url || job.video_url}
            </a>
          </div>
        )}

        {/* Video-Upload-Original: kein interner Pfad, nur Datum. */}
        {job.video_storage_path && job.kind === "video_file" && (
          <div className="border border-champagne/15 p-4 md:p-5 mb-6">
            <p className="eyebrow mb-2">Original-Datei</p>
            <p className="text-cream/65 text-sm">Upload vom {uploadedLabel}</p>
          </div>
        )}

        {job.manual_note && (
          <div className="border-l-2 border-champagne/40 pl-4 mb-6">
            <p className="text-cream/55 text-[10px] uppercase tracking-[0.25em] mb-1">Dein Hinweis</p>
            <p className="text-cream/80 italic">„{job.manual_note}"</p>
          </div>
        )}

        {job.status === "submitted" && (
          <div className="border border-champagne/15 p-5 md:p-7 mb-6">
            <p className="font-display italic text-cream text-xl mb-2">
              In Pruefung.
            </p>
            <p className="text-cream/65 text-sm leading-relaxed">
              Wir schauen uns deinen Content an und melden uns mit konkreten
              Hinweisen. Bei Profil-/Account-Checks kann es 1-2 Tage dauern,
              bei einzelnen Videos meist schneller.
            </p>
          </div>
        )}

        {(job.status === "queued" || job.status === "processing") && (
          <div className="border border-champagne/15 p-5 md:p-7 mb-6">
            <p className="font-display italic text-cream text-xl mb-2">
              {job.status === "queued" ? "Wartet auf den Worker." : "Analyse laeuft."}
            </p>
            <p className="text-cream/65 text-sm leading-relaxed">
              Du bekommst Bescheid sobald das Ergebnis da ist.
            </p>
          </div>
        )}

        {job.status === "failed" && job.error_message && (
          <div className="border border-red-400/40 bg-red-400/5 p-5 mb-6">
            <p className="eyebrow text-red-300 mb-2">Fehler</p>
            <p className="text-red-300/85 text-sm">{job.error_message}</p>
          </div>
        )}

        {(job.status === "done" || job.status === "reviewed") && (
          <>
            {/* KURZFAZIT — Hero-Card mit Hook-Score + Strongest + Biggest Issue */}
            {(hookScore !== null || strongest || biggestIssue) && (
              <div className="border border-champagne bg-champagne/[0.06] p-5 md:p-8 mb-6">
                <p className="eyebrow text-champagne mb-6">Kurzfazit</p>
                {hookScore !== null && (
                  <div className="mb-6 pb-6 border-b border-champagne/15">
                    <p className="text-cream/55 text-[10px] uppercase tracking-[0.3em] mb-3">
                      Scroll-Stop Potential
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="font-display italic text-champagne text-7xl md:text-8xl leading-none tracking-[-0.02em]">
                        {hookScore}
                      </p>
                      <p className="text-cream/35 font-display italic text-3xl md:text-4xl leading-none">
                        /10
                      </p>
                    </div>
                  </div>
                )}
                {strongest && (
                  <div className="mb-4">
                    <p className="text-cream/55 text-[10px] uppercase tracking-[0.3em] mb-2">Staerkste Sache</p>
                    <p className="text-cream text-base md:text-lg leading-relaxed">{strongest}</p>
                  </div>
                )}
                {biggestIssue && (
                  <div>
                    <p className="text-cream/55 text-[10px] uppercase tracking-[0.3em] mb-2">Groesster Fehler</p>
                    <p className="text-cream text-base md:text-lg leading-relaxed">{biggestIssue}</p>
                  </div>
                )}
              </div>
            )}

            {/* ERGEBNIS — strukturierte Sections */}
            <div className="border border-champagne/30 bg-champagne/[0.03] p-5 md:p-8 mb-6">
              <p className="eyebrow text-champagne mb-6">Analyse</p>
              <SummaryRenderer summary={summary} />

              {/* Skalar-Werte als Inline-Badges */}
              {scalarEntries.length > 0 && (
                <div className="mt-8 pt-6 border-t border-champagne/15">
                  <p className="eyebrow text-champagne mb-3">Werte</p>
                  <div className="flex flex-wrap gap-2">
                    {scalarEntries.map(([k, v]) => (
                      <div key={k} className="border border-champagne/20 px-3 py-2">
                        <p className="text-cream/45 text-[9px] uppercase tracking-[0.25em]">{k}</p>
                        <p className="font-display italic text-champagne text-lg leading-none mt-1">{String(v)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Listen als Vertical-Stack-Cards (volle Breite) */}
              {listEntries.length > 0 && (
                <div className="mt-6 space-y-4">
                  {listEntries.map(([k, v]) => (
                    <div key={k} className="border border-champagne/15 p-4 md:p-5">
                      <p className="eyebrow text-champagne mb-3">{k}</p>
                      <ul className="space-y-2">
                        {(v as unknown[]).map((item, i) => (
                          <li
                            key={i}
                            className="text-cream/85 text-sm md:text-base leading-relaxed pl-4 border-l border-champagne/30"
                          >
                            {String(item)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {job.ai_provider && (
                <p className="text-cream/35 text-[10px] uppercase tracking-[0.25em] mt-6 pt-4 border-t border-champagne/10">
                  Analysiert via {job.ai_provider}
                  {job.ai_model && <> · {job.ai_model}</>}
                  {job.reviewed_at && (
                    <> · {new Date(job.reviewed_at).toLocaleDateString("de-DE")}</>
                  )}
                </p>
              )}
            </div>

            {/* Creator-CTA: neue Analyse starten */}
            <div className="border border-champagne/15 p-4 md:p-5 mb-6 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-cream/65 text-sm">Bereit fuer den naechsten Content?</p>
              <Link
                href="/portal/services/content-helper/new"
                className="text-champagne hover:text-champagne-300 text-[10px] uppercase tracking-[0.25em]"
              >
                Neue Analyse starten →
              </Link>
            </div>
          </>
        )}

        {/* ADMIN TOOLS — am Ende, eingeklappt by default */}
        {isAdmin && (
          <details className="mt-10 border-t border-champagne/10 pt-6 group">
            <summary className="cursor-pointer flex items-center justify-between gap-3 py-2 select-none">
              <span className="eyebrow text-cream/55">Admin · Tools</span>
              <span className="text-cream/35 text-[10px] uppercase tracking-[0.25em] group-open:hidden">
                Anzeigen →
              </span>
              <span className="text-cream/35 text-[10px] uppercase tracking-[0.25em] hidden group-open:inline">
                Verbergen ↑
              </span>
            </summary>
            <div className="mt-4">
              <AdminTriggerPanel
                id={job.id}
                kind={job.kind}
                status={job.status}
                costUsd={job.cost_usd}
                processingStartedAt={job.processing_started_at}
                reviewedAt={job.reviewed_at}
                errorMessage={job.error_message}
                aiProvider={job.ai_provider}
                aiModel={job.ai_model}
              />
            </div>
          </details>
        )}
      </main>
    </>
  );
}
