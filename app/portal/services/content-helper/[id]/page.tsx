import Link from "next/link";
import { notFound } from "next/navigation";
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

        {isAdmin && (
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
        )}

        {(job.source_url || job.video_url) && (
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

        {job.video_storage_path && (
          <div className="border border-champagne/15 p-4 md:p-5 mb-6">
            <p className="eyebrow mb-2">Datei</p>
            <p className="text-cream/65 text-sm font-mono break-all">{job.video_storage_path}</p>
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
          <div className="border border-champagne/30 bg-champagne/[0.03] p-5 md:p-8 mb-6">
            <p className="eyebrow text-champagne mb-6">Ergebnis</p>

            {/* Strukturiertes Rendering: parst STIMMUNG / STAERKEN / SCHWAECHEN /
                FIX-ANWEISUNGEN / HOOK-SCORE Sections aus Anthropic-Output. */}
            <SummaryRenderer summary={summary} />

            {/* AI-Score (separate Stats — von Worker als JSON-Block extrahiert) */}
            {aiScore && Object.keys(aiScore).length > 0 && (
              <div className="mt-8 pt-6 border-t border-champagne/15">
                <p className="eyebrow text-champagne mb-4">Werte</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                  {Object.entries(aiScore).map(([k, v]) => {
                    // Arrays als Listen, sonst als String
                    const isArray = Array.isArray(v);
                    return (
                      <div key={k} className="border border-champagne/15 p-3 md:p-4">
                        <p className="text-cream/45 text-[10px] uppercase tracking-[0.25em] mb-2">{k}</p>
                        {isArray ? (
                          <ul className="space-y-1">
                            {(v as unknown[]).slice(0, 5).map((item, i) => (
                              <li key={i} className="text-cream/80 text-xs leading-snug">{String(item)}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="font-display italic text-champagne text-xl md:text-2xl leading-none">
                            {String(v)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
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
        )}
      </main>
    </>
  );
}
