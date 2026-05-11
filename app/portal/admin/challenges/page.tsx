import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

export const dynamic = "force-dynamic";

export default async function AdminChallengesPage() {
  const { supabase, profile } = await requireAdmin();

  const { data: rows } = await supabase
    .from("academy_challenges")
    .select("id, slug, title, description, is_active, starts_at, ends_at, reward_label, category_slug, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const challenges = rows ?? [];

  // Submission-Counts pro Challenge
  const ids = challenges.map((c) => c.id);
  const subsMap = new Map<string, { total: number; pending: number; winners: number }>();
  if (ids.length) {
    const { data: subs } = await supabase
      .from("academy_challenge_submissions")
      .select("challenge_id, status")
      .in("challenge_id", ids);
    for (const id of ids) subsMap.set(id, { total: 0, pending: 0, winners: 0 });
    for (const s of subs ?? []) {
      const m = subsMap.get(s.challenge_id) ?? { total: 0, pending: 0, winners: 0 };
      m.total += 1;
      if (s.status === "submitted") m.pending += 1;
      if (s.status === "winner") m.winners += 1;
      subsMap.set(s.challenge_id, m);
    }
  }

  const now = new Date();
  const active = challenges.filter((c) => c.is_active && (!c.ends_at || new Date(c.ends_at) > now)).length;
  const ended = challenges.filter((c) => c.ends_at && new Date(c.ends_at) <= now).length;
  const totalPending = Array.from(subsMap.values()).reduce((s, v) => s + v.pending, 0);

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
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-4">
          <p className="eyebrow">Admin · Academy</p>
          <Link
            href="/portal/admin/challenges/new"
            className="text-champagne hover:text-champagne-300 text-[10px] uppercase tracking-[0.25em] border border-champagne/40 px-3 py-2 inline-flex"
          >
            + Neue Challenge
          </Link>
        </div>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          Challenges <span className="text-champagne">Cockpit.</span>
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-10 max-w-2xl">
          Anlegen, aktivieren, Einsendungen pruefen, Gewinner markieren —
          alles hier. Aktivierung pusht automatisch eine Inbox-Notification
          an alle aktiven Creator.
        </p>

        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-10 md:mb-14">
          <Count label="Aktiv" value={active} highlight={active > 0} />
          <Count label="Einsendungen offen" value={totalPending} highlight={totalPending > 0} />
          <Count label="Beendet" value={ended} />
        </div>

        {challenges.length === 0 && (
          <div className="border border-champagne/15 p-8 text-center">
            <p className="font-display italic text-cream/45 text-xl">Noch keine Challenges.</p>
            <Link
              href="/portal/admin/challenges/new"
              className="inline-flex mt-4 btn-cta btn-shimmer"
            >
              Erste Challenge anlegen
              <span className="btn-cta-arrow" aria-hidden>→</span>
            </Link>
          </div>
        )}

        <ul className="space-y-3">
          {challenges.map((c) => {
            const subs = subsMap.get(c.id) ?? { total: 0, pending: 0, winners: 0 };
            const ended = c.ends_at && new Date(c.ends_at) <= now;
            return (
              <li key={c.id} className={`border p-4 md:p-5 ${
                c.is_active && !ended ? "border-champagne/30 bg-champagne/[0.03]"
                : ended ? "border-cream/[0.08]"
                : "border-champagne/15"
              }`}>
                <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
                  <Link href={`/portal/admin/challenges/${c.id}`} className="font-display italic text-cream text-lg md:text-xl hover:text-champagne">
                    {c.title}
                  </Link>
                  <span className={`shrink-0 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] ${
                    c.is_active && !ended ? "bg-champagne text-ink"
                    : ended ? "border border-cream/20 text-cream/55"
                    : "border border-champagne/40 text-champagne"
                  }`}>
                    {ended ? "beendet" : c.is_active ? "aktiv" : "inaktiv"}
                  </span>
                </div>
                <p className="text-cream/65 text-sm leading-relaxed mb-3 line-clamp-2">{c.description}</p>
                <div className="flex items-center justify-between gap-3 flex-wrap text-[10px] uppercase tracking-[0.25em]">
                  <span className="text-cream/45">
                    {c.category_slug && <>· {c.category_slug} </>}
                    {c.reward_label && <>· {c.reward_label} </>}
                    {c.ends_at && <>· endet {new Date(c.ends_at).toLocaleDateString("de-DE")}</>}
                  </span>
                  <span className="text-cream/55">
                    {subs.total} Einsendung{subs.total === 1 ? "" : "en"}
                    {subs.pending > 0 && <span className="text-champagne"> · {subs.pending} offen</span>}
                    {subs.winners > 0 && <> · {subs.winners} 🏆</>}
                  </span>
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
    <div className={`border p-5 md:p-6 ${highlight ? "border-champagne bg-champagne/5" : "border-champagne/15"}`}>
      <p className="text-cream/45 text-[10px] uppercase tracking-[0.25em] mb-3">{label}</p>
      <p className={`font-display italic font-black text-3xl md:text-4xl leading-none ${highlight ? "text-champagne" : "text-cream"}`}>
        {value}
      </p>
    </div>
  );
}
