import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  submitted: "Eingereicht",
  queued: "In Warteschlange",
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

export default async function ContentHelperHub() {
  const { supabase, profile } = await getAuthedProfile();

  const { data: jobs } = await supabase
    .from("content_reviews")
    .select("id, kind, source_url, status, manual_note, created_at, reviewed_at")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(40);

  const rows = jobs ?? [];
  const openJobs = rows.filter((j) =>
    ["submitted", "queued", "processing"].includes(j.status),
  ).length;

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

      <main className="container-luxe relative z-10 py-12 md:py-16 max-w-3xl">
        <div className="mb-10">
          <Link
            href="/portal/services"
            className="text-cream/45 hover:text-champagne text-[11px] uppercase tracking-[0.25em] inline-flex items-center"
          >
            ← Creator Services
          </Link>
        </div>

        <p className="eyebrow mb-3">Content Helfer</p>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          Profi-Feedback auf <span className="text-champagne">deinen Content.</span>
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-10 max-w-xl">
          Reiche Video, Bild oder Link ein. Wir analysieren Hook, Schnitt,
          Licht, Ton, TikTok-Tauglichkeit + geben konkrete Verbesserungen.
        </p>

        <div className="flex items-center justify-between gap-3 mb-8 flex-wrap">
          <p className="text-cream/45 text-xs">
            {rows.length} Anfragen total
            {openJobs > 0 && (
              <span className="text-champagne"> · {openJobs} offen</span>
            )}
          </p>
          <Link
            href="/portal/services/content-helper/new"
            className="btn-cta btn-shimmer"
          >
            Neue Anfrage
            <span className="btn-cta-arrow" aria-hidden>→</span>
          </Link>
        </div>

        {rows.length === 0 && (
          <div className="border border-champagne/15 p-8 md:p-10 text-center">
            <p className="font-display italic text-cream/45 text-xl mb-2">
              Noch keine Anfragen.
            </p>
            <p className="text-cream/35 text-sm">
              Sobald du etwas einreichst, erscheint es hier mit Status + Ergebnis.
            </p>
          </div>
        )}

        <ul className="space-y-3">
          {rows.map((j) => (
            <li key={j.id}>
              <Link
                href={`/portal/services/content-helper/${j.id}`}
                className="border border-champagne/15 hover:border-champagne/40 hover:bg-champagne/5 p-4 md:p-5 transition-colors block"
              >
                <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
                  <p className="font-display italic text-cream text-lg md:text-xl">
                    {KIND_LABEL[j.kind] ?? j.kind}
                  </p>
                  <span className={`shrink-0 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] ${STATUS_TONE[j.status] ?? ""}`}>
                    {STATUS_LABEL[j.status] ?? j.status}
                  </span>
                </div>
                {j.source_url && (
                  <p className="text-cream/55 text-xs truncate mb-1">{j.source_url}</p>
                )}
                {j.manual_note && (
                  <p className="text-cream/55 text-sm italic truncate">„{j.manual_note}"</p>
                )}
                <p className="text-cream/35 text-[10px] uppercase tracking-[0.25em] mt-2">
                  {new Date(j.created_at).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <p className="text-cream/35 text-xs mt-12 leading-relaxed">
          Limit: max 5 offene Anfragen gleichzeitig. Sobald du Antwort hast,
          kannst du weitere stellen.
        </p>
      </main>
    </>
  );
}
