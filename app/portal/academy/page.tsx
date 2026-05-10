import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { CATEGORIES } from "@/lib/academy/data";
import { QUIZZES } from "@/lib/academy/quizzes";

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
  const completedSet = new Set(
    (progressRows ?? []).map((r) => `${r.category_slug}::${r.lesson_slug}`),
  );

  const totalLessons = CATEGORIES.reduce((sum, c) => sum + c.lessons.length, 0);
  const doneLessons = (progressRows ?? []).length;
  const pct = totalLessons === 0 ? 0 : Math.round((doneLessons / totalLessons) * 100);

  // Search-Filter
  const filteredCategories = query
    ? CATEGORIES.filter((c) => {
        const text = (c.title + " " + c.intro + " " +
          c.lessons.map((l) => l.title + " " + l.summary).join(" ")
        ).toLowerCase();
        return text.includes(query);
      })
    : CATEGORIES;

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
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
          Praktisches Wissen aus Backstage-Schulungen, dem TikTok LIVE
          Deutschland-Account und ZOE-Standards. Quiz dich durch + sammle
          deinen Fortschritt.
        </p>

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

        {/* Search */}
        <form method="get" action="/portal/academy" className="mb-8">
          <div className="relative">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Suche · z.B. Battle, Watchtime, Shadowban …"
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
              Versuche andere Begriffe — Battle, Watchtime, Shadowban,
              Geschenke, Match, Mod.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
