import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { CATEGORIES } from "@/lib/academy/data";
import { QUIZZES } from "@/lib/academy/quizzes";
import {
  INSIDER_CARDS, INSIDER_TONE_LABEL, INSIDER_TONE_STYLE, INSIDER_TONE_LABEL_STYLE,
} from "@/lib/academy/insider";

export const dynamic = "force-dynamic";

interface SearchProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AcademyHubPage({ searchParams }: SearchProps) {
  const { supabase, profile } = await getAuthedProfile();
  const sp = await searchParams;
  const query = (sp.q || "").trim().toLowerCase();

  // Progress laden
  const { data: progressRows } = await supabase
    .from("academy_lesson_reads")
    .select("category_slug, lesson_slug")
    .eq("profile_id", profile.id);

  // Nur Reads zaehlen, die zu aktuell existierenden Lessons gehoeren.
  // Geist-Rows (umbenannte/entfernte Lessons) wuerden sonst doneLessons
  // ueber totalLessons treiben → 105% etc.
  const validLessonSet = new Set<string>();
  for (const cat of CATEGORIES) {
    for (const l of cat.lessons) validLessonSet.add(`${cat.slug}::${l.slug}`);
  }
  const completedSet = new Set(
    (progressRows ?? [])
      .map((r) => `${r.category_slug}::${r.lesson_slug}`)
      .filter((k) => validLessonSet.has(k)),
  );

  const totalLessons = CATEGORIES.reduce((sum, c) => sum + c.lessons.length, 0);
  const doneLessons = Math.min(completedSet.size, totalLessons);
  const pct =
    totalLessons === 0
      ? 0
      : Math.min(100, Math.round((doneLessons / totalLessons) * 100));

  // Search-Filter
  const filteredCategories = query
    ? CATEGORIES.filter((c) => {
        const text = (c.title + " " + c.intro + " " +
          c.lessons.map((l) => l.title + " " + l.summary).join(" ")
        ).toLowerCase();
        return text.includes(query);
      })
    : CATEGORIES;

  // V2: Aktive Weekly Challenge + Leaderboard Top 5
  const nowIso = new Date().toISOString();
  const [{ data: activeChallenges }, { data: leaderboard }] = await Promise.all([
    supabase
      .from("academy_challenges")
      .select("id, slug, title, description, reward_label, starts_at, ends_at")
      .eq("is_active", true)
      .or(`ends_at.gt.${nowIso},ends_at.is.null`)
      .order("starts_at", { ascending: false })
      .limit(1),
    supabase
      .from("academy_creator_xp")
      .select("profile_id, display_name, tiktok_username, avatar_url, xp_total, lessons_read, quizzes_passed")
      .gt("xp_total", 0)
      .order("xp_total", { ascending: false })
      .limit(5),
  ]);
  const challenge = activeChallenges?.[0] ?? null;
  const lbRows = leaderboard ?? [];
  const myXp = lbRows.find((r) => r.profile_id === profile.id) ?? null;

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
        <p className="eyebrow mb-3">Academy</p>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          Alles was du fuer <span className="text-champagne">starkes LIVE</span> wissen musst.
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-6 max-w-2xl">
          Praktisches Wissen aus Backstage-Schulungen, dem TikTok LIVE
          Deutschland-Account und ZOE-Standards. Quiz dich durch + sammle
          deinen Fortschritt.
        </p>

        {/* Quellen-Transparenz · ehrliche Kennzeichnung */}
        <div className="mb-8 border-l border-champagne/30 pl-4 py-1 text-cream/55 text-xs md:text-sm leading-relaxed max-w-2xl">
          <p>
            <span className="text-champagne font-medium">Quellen-Hinweis:</span>{" "}
            Wir trennen klar zwischen offiziellen TikTok-Angaben (z.B.
            25-Min-LIVE-Tag fuer Boni) und Agency-Erfahrungswerten
            (z.B. typische Stream-Laenge, Hook-Strategien). Erfahrungswerte
            sind im Text als solche markiert — bitte nicht als TikTok-
            Garantie verstehen.
          </p>
        </div>

        {/* Progress-Bar */}
        <div className="border border-champagne/15 p-4 md:p-5 mb-8">
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <p className="eyebrow">Dein Fortschritt</p>
            <span className="font-display italic text-champagne text-xl">{pct}%</span>
          </div>
          <div className="h-px bg-champagne/15 mb-3 overflow-hidden">
            <div
              className="h-full bg-champagne transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-cream/55 text-xs">
            {doneLessons} von {totalLessons} Lektionen gelesen
            {QUIZZES.length > 0 && <> · {QUIZZES.length} Quiz verfuegbar</>}
          </p>
        </div>

        {/* Weekly Challenge */}
        {challenge && (
          <section className="mb-8 border border-champagne bg-champagne/5 p-5 md:p-6">
            <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
              <p className="eyebrow text-champagne">Aktuelle Challenge</p>
              {challenge.reward_label && (
                <span className="px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] bg-champagne text-ink">
                  {challenge.reward_label}
                </span>
              )}
            </div>
            <h2 className="font-display italic text-cream text-xl md:text-2xl leading-tight mb-2">
              {challenge.title}
            </h2>
            <p className="text-cream/65 text-sm md:text-base leading-relaxed mb-3">
              {challenge.description}
            </p>
            {challenge.ends_at && (
              <p className="text-cream/40 text-[10px] uppercase tracking-[0.25em]">
                Endet {new Date(challenge.ends_at).toLocaleDateString("de-DE", { day: "2-digit", month: "long" })}
              </p>
            )}
          </section>
        )}

        {/* Leaderboard */}
        {lbRows.length > 0 && (
          <section className="mb-8 border border-champagne/15 p-5 md:p-6">
            <div className="flex items-baseline justify-between mb-4">
              <p className="eyebrow">Leaderboard · Top 5</p>
              {myXp && (
                <span className="text-cream/55 text-[10px] uppercase tracking-[0.25em]">
                  Dein XP: {myXp.xp_total}
                </span>
              )}
            </div>
            <ul className="space-y-2.5">
              {lbRows.map((r, i) => {
                const isMe = r.profile_id === profile.id;
                return (
                  <li key={r.profile_id} className={`flex items-center gap-3 ${isMe ? "text-champagne" : "text-cream/80"}`}>
                    <span className="shrink-0 font-display italic text-lg w-6 text-cream/45">{i + 1}</span>
                    <span className="flex-1 min-w-0 truncate text-sm">
                      {r.display_name || `@${r.tiktok_username}`}
                      {isMe && <span className="text-champagne/70 text-[10px] ml-2 uppercase tracking-[0.22em]">du</span>}
                    </span>
                    <span className="shrink-0 text-xs text-cream/55">
                      {r.lessons_read}L · {r.quizzes_passed}Q · {r.xp_total} XP
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="text-cream/35 text-[10px] uppercase tracking-[0.25em] mt-4 leading-relaxed">
              XP-Formel: 1 Lektion = 5 XP · 1 Quiz bestanden = 25 XP · 1 Challenge-Sieg = 100 XP
            </p>
          </section>
        )}

        {/* Search */}
        <form method="get" action="/portal/academy" className="mb-8">
          <div className="relative">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Suche · z.B. Battle, Watchtime, Account Status …"
              className="w-full bg-transparent border-b border-champagne/20 focus:border-champagne text-cream py-2.5 placeholder-cream/30 focus:outline-none"
            />
            {query && (
              <Link
                href="/portal/academy"
                className="absolute right-0 top-1/2 -translate-y-1/2 text-cream/45 hover:text-champagne text-[10px] uppercase tracking-[0.25em]"
              >
                Reset
              </Link>
            )}
          </div>
          {query && (
            <p className="text-cream/35 text-xs mt-2">
              {filteredCategories.length} Treffer fuer „{query}"
            </p>
          )}
        </form>

        {/* INSIDER-CARDS · harte Agency-Wahrheit */}
        <section className="mb-10 md:mb-12">
          <div className="flex items-baseline justify-between mb-4">
            <p className="eyebrow">Insider · harte Wahrheit</p>
            <span className="text-cream/35 text-[10px] uppercase tracking-[0.25em]">
              Aus echten Lives
            </span>
          </div>
          <ul className="grid gap-2.5 md:grid-cols-2">
            {INSIDER_CARDS.slice(0, 8).map((c, i) => (
              <li
                key={i}
                className={`border p-4 md:p-5 ${INSIDER_TONE_STYLE[c.tone]}`}
              >
                <div className="flex items-baseline gap-2 mb-2 flex-wrap">
                  <span className={`px-2 py-0.5 text-[9px] uppercase tracking-[0.22em] ${INSIDER_TONE_LABEL_STYLE[c.tone]}`}>
                    {INSIDER_TONE_LABEL[c.tone]}
                  </span>
                </div>
                <p className="text-cream text-sm md:text-base leading-snug font-medium mb-1.5">
                  {c.title}
                </p>
                <p className="text-cream/65 text-xs md:text-sm leading-relaxed mb-1">
                  {c.body}
                </p>
                {c.why && (
                  <p className="text-cream/40 text-[10px] italic mt-1.5">
                    {c.why}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <p className="text-cream/35 text-[10px] uppercase tracking-[0.25em] mt-4">
            {INSIDER_CARDS.length} Karten gesamt — Rest folgt in den Lektionen
          </p>
        </section>

        <div className="grid gap-3 md:gap-4 md:grid-cols-2 mb-8">
          <Link
            href="/portal/academy/quiz"
            className="border border-champagne/30 hover:border-champagne hover:bg-champagne/5 p-5 md:p-6 transition-colors block group"
          >
            <div className="flex items-baseline justify-between gap-3 mb-2.5">
              <h2 className="font-display italic text-cream text-xl md:text-2xl leading-tight">
                Quiz
              </h2>
              <span className="shrink-0 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.25em] bg-champagne text-ink">
                {QUIZZES.length} verfuegbar
              </span>
            </div>
            <p className="text-cream/65 text-sm leading-relaxed">
              5-Fragen-Wissens-Challenges pro Kategorie. Score wird gespeichert,
              Best-Score zaehlt.
            </p>
            <p className="mt-3 text-champagne text-[10px] uppercase tracking-[0.25em] group-hover:text-champagne-300">
              Quiz starten →
            </p>
          </Link>

          <Link
            href="/portal/academy/gifts"
            className="border border-champagne/30 hover:border-champagne hover:bg-champagne/5 p-5 md:p-6 transition-colors block group"
          >
            <div className="flex items-baseline justify-between gap-3 mb-2.5">
              <h2 className="font-display italic text-cream text-xl md:text-2xl leading-tight">
                Geschenke
              </h2>
              <span className="shrink-0 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.25em] bg-champagne text-ink">
                Galerie
              </span>
            </div>
            <p className="text-cream/65 text-sm leading-relaxed">
              18 TikTok-Geschenke mit Bild, Diamonds, Coins + Bedeutung im LIVE.
            </p>
            <p className="mt-3 text-champagne text-[10px] uppercase tracking-[0.25em] group-hover:text-champagne-300">
              Oeffnen →
            </p>
          </Link>
        </div>

        <div className="grid gap-3 md:gap-4">
          {filteredCategories.map((cat) => {
            const done = cat.lessons.filter((l) =>
              completedSet.has(`${cat.slug}::${l.slug}`),
            ).length;
            return (
              <Link
                key={cat.slug}
                href={`/portal/academy/${cat.slug}`}
                className="border border-champagne/15 hover:border-champagne hover:bg-champagne/5 p-5 md:p-6 transition-colors block group"
              >
                <div className="flex items-baseline justify-between gap-3 mb-2.5">
                  <h2 className="font-display italic text-cream text-lg md:text-xl leading-tight">
                    {cat.title}
                  </h2>
                  <span className="shrink-0 text-cream/40 text-[10px] uppercase tracking-[0.25em]">
                    {done}/{cat.lessons.length}
                  </span>
                </div>
                <p className="text-cream/55 text-sm leading-relaxed">{cat.intro}</p>
                <p className="mt-3 text-champagne text-[10px] uppercase tracking-[0.25em] group-hover:text-champagne-300">
                  Reinlesen →
                </p>
              </Link>
            );
          })}
        </div>

        {filteredCategories.length === 0 && (
          <div className="border border-champagne/15 p-8 text-center">
            <p className="text-cream/45 italic font-display text-lg">
              Keine Treffer fuer „{query}".
            </p>
            <p className="text-cream/35 text-sm mt-2">
              Versuche andere Begriffe — Battle, Watchtime, Account Status,
              Geschenke, Match, Mod.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
