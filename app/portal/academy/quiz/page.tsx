import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { QUIZZES, bestScoreForUser } from "@/lib/academy/quizzes";
import { CATEGORIES } from "@/lib/academy/data";

export const dynamic = "force-dynamic";

export default async function QuizHubPage() {
  const { supabase, profile } = await getAuthedProfile();

  const { data: attempts } = await supabase
    .from("academy_quiz_attempts")
    .select("quiz_slug, score, max_score")
    .eq("profile_id", profile.id);
  const bestMap = bestScoreForUser((attempts as Array<{ quiz_slug: string; score: number; max_score: number }>) ?? []);

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

      <main className="container-luxe relative z-10 py-12 md:py-16 pb-28 md:pb-16 max-w-3xl">
        <div className="mb-10">
          <Link
            href="/portal/academy"
            className="text-cream/45 hover:text-champagne text-[11px] uppercase tracking-[0.25em] inline-flex items-center"
          >
            ← Academy
          </Link>
        </div>

        <p className="eyebrow mb-3">Wissens-Quiz</p>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          Schnell-Check <span className="text-champagne">pro Kategorie.</span>
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-12 max-w-xl">
          5 Fragen pro Quiz, 2-3 Minuten. Best-Score wird gespeichert.
          Beliebig oft wiederholbar.
        </p>

        <div className="grid gap-3 md:gap-4 md:grid-cols-2">
          {QUIZZES.map((q) => {
            const best = bestMap.get(q.slug);
            const category = CATEGORIES.find((c) => c.slug === q.category_slug);
            return (
              <Link
                key={q.slug}
                href={`/portal/academy/quiz/${q.slug}`}
                className="border border-champagne/15 hover:border-champagne hover:bg-champagne/5 p-5 md:p-6 transition-colors block group"
              >
                <p className="eyebrow mb-2 text-cream/55">{category?.title ?? q.category_slug}</p>
                <h2 className="font-display italic text-cream text-xl md:text-2xl leading-tight mb-2">
                  {q.title}
                </h2>
                <p className="text-cream/60 text-sm leading-relaxed mb-3">
                  {q.intro}
                </p>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-cream/40 text-[10px] uppercase tracking-[0.25em]">
                    {q.questions.length} Fragen
                  </span>
                  {best && (
                    <span className="text-champagne text-[10px] uppercase tracking-[0.25em]">
                      Best: {best.score}/{best.max_score}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-champagne text-[10px] uppercase tracking-[0.25em] group-hover:text-champagne-300">
                  Starten →
                </p>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
