import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { ToggleActive, ExtendButton, ReviewButtons } from "./AdminActions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  submitted: "Eingereicht",
  approved: "Approved",
  rejected: "Abgelehnt",
  winner: "🏆 Gewinner",
};

const STATUS_TONE: Record<string, string> = {
  submitted: "border border-champagne/40 text-champagne",
  approved: "border border-emerald-400/40 text-emerald-300/85",
  rejected: "border border-red-400/40 text-red-300/85",
  winner: "bg-champagne text-ink",
};

interface Props { params: Promise<{ id: string }>; }

export default async function ChallengeDetailPage({ params }: Props) {
  const { id } = await params;
  const { supabase, profile } = await requireAdmin();

  const { data: c } = await supabase
    .from("academy_challenges")
    .select("id, slug, title, description, body_md, category_slug, reward_label, is_active, starts_at, ends_at, created_at, created_by")
    .eq("id", id)
    .maybeSingle();
  if (!c) notFound();

  const { data: subs } = await supabase
    .from("academy_challenge_submissions")
    .select("id, profile_id, body, proof_url, status, reviewed_at, created_at")
    .eq("challenge_id", id)
    .order("created_at", { ascending: false })
    .limit(200);
  const submissions = subs ?? [];

  const profileIds = Array.from(new Set(submissions.map((s) => s.profile_id)));
  const { data: profs } = profileIds.length
    ? await supabase.from("profiles").select("id, display_name, tiktok_username").in("id", profileIds)
    : { data: [] };
  const pmap = new Map((profs ?? []).map((p) => [p.id, p]));

  const now = new Date();
  const ended = c.ends_at && new Date(c.ends_at) <= now;
  const pending = submissions.filter((s) => s.status === "submitted").length;
  const winners = submissions.filter((s) => s.status === "winner").length;

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        tiktokUsername={profile.tiktok_username}
        avatarUrl={profile.avatar_url}
        isAdmin
      />

      <main className="container-luxe py-12 md:py-16 max-w-3xl">
        <div className="mb-8">
          <Link href="/portal/admin/challenges" className="text-cream/45 hover:text-champagne text-[11px] uppercase tracking-[0.25em]">
            ← Challenges
          </Link>
        </div>

        <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
          <p className="eyebrow">Admin · Challenge</p>
          <span className={`px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] ${
            c.is_active && !ended ? "bg-champagne text-ink"
            : ended ? "border border-cream/20 text-cream/55"
            : "border border-champagne/40 text-champagne"
          }`}>
            {ended ? "beendet" : c.is_active ? "aktiv" : "inaktiv"}
          </span>
        </div>

        <h1 className="font-display italic text-cream text-3xl md:text-4xl leading-[1.05] tracking-[-0.02em] mb-4">
          {c.title}
        </h1>

        <p className="text-cream/65 text-base md:text-lg leading-relaxed mb-6">
          {c.description}
        </p>

        <div className="flex items-center gap-3 flex-wrap mb-8 text-[10px] uppercase tracking-[0.25em] text-cream/45">
          {c.category_slug && <span>· {c.category_slug}</span>}
          {c.reward_label && <span>· {c.reward_label}</span>}
          {c.starts_at && <span>· Start {new Date(c.starts_at).toLocaleDateString("de-DE")}</span>}
          {c.ends_at && <span>· Ende {new Date(c.ends_at).toLocaleDateString("de-DE")}</span>}
        </div>

        {c.body_md && (
          <section className="border border-champagne/10 p-4 md:p-5 mb-8 whitespace-pre-wrap text-cream/80 text-sm leading-relaxed font-mono">
            {c.body_md}
          </section>
        )}

        <div className="flex items-center gap-3 flex-wrap mb-10">
          <ToggleActive id={c.id} active={c.is_active} />
          <ExtendButton id={c.id} currentEnd={c.ends_at} />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <Count label="Total" value={submissions.length} />
          <Count label="Offen" value={pending} highlight={pending > 0} />
          <Count label="Gewinner" value={winners} />
        </div>

        <p className="eyebrow mb-4">Einsendungen</p>
        {submissions.length === 0 && (
          <p className="text-cream/45 italic font-display text-lg">Noch keine Einsendungen.</p>
        )}
        <ul className="space-y-3">
          {submissions.map((s) => {
            const p = pmap.get(s.profile_id);
            return (
              <li key={s.id} className="border border-champagne/15 p-4 md:p-5">
                <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
                  <p className="font-display italic text-cream text-base md:text-lg">
                    {p?.display_name || "—"} {p?.tiktok_username && <span className="text-cream/45 text-sm">@{p.tiktok_username}</span>}
                  </p>
                  <span className={`shrink-0 px-2 py-0.5 text-[9px] uppercase tracking-[0.22em] ${STATUS_TONE[s.status] ?? ""}`}>
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </div>
                {s.body && <p className="text-cream/75 text-sm leading-relaxed whitespace-pre-wrap mb-2">{s.body}</p>}
                {s.proof_url && (
                  <p className="text-cream/55 text-[11px] uppercase tracking-[0.22em] mb-2 break-all">
                    <a href={s.proof_url} target="_blank" rel="noopener noreferrer" className="text-champagne hover:text-champagne-300">
                      Proof oeffnen →
                    </a>
                  </p>
                )}
                <div className="flex items-center justify-between gap-3 flex-wrap mt-2 pt-2 border-t border-champagne/10">
                  <span className="text-cream/35 text-[10px] uppercase tracking-[0.25em]">
                    {new Date(s.created_at).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}
                    {s.reviewed_at && <> · reviewed {new Date(s.reviewed_at).toLocaleDateString("de-DE")}</>}
                  </span>
                  <ReviewButtons submission_id={s.id} />
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}

function Count({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`border p-4 md:p-5 ${highlight ? "border-champagne bg-champagne/5" : "border-champagne/15"}`}>
      <p className="text-cream/45 text-[10px] uppercase tracking-[0.25em] mb-2">{label}</p>
      <p className={`font-display italic font-black text-2xl md:text-3xl leading-none ${highlight ? "text-champagne" : "text-cream"}`}>{value}</p>
    </div>
  );
}
