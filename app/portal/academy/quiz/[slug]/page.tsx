import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { QUIZZES, bestScoreForUser } from "@/lib/academy/quizzes";
import { QuizRunner } from "./QuizRunner";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function QuizPlayPage({ params }: Props) {
  const { slug } = await params;
  const { supabase, profile } = await getAuthedProfile();
  const quiz = QUIZZES.find((q) => q.slug === slug);
  if (!quiz) notFound();

  const { data: attempts } = await supabase
    .from("academy_quiz_attempts")
    .select("quiz_slug, score, max_score, attempted_at")
    .eq("profile_id", profile.id)
    .eq("quiz_slug", slug)
    .order("attempted_at", { ascending: false })
    .limit(5);

  const bestMap = bestScoreForUser((attempts as Array<{ quiz_slug: string; score: number; max_score: number }>) ?? []);
  const best = bestMap.get(slug);

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
            href="/portal/academy/quiz"
            className="text-cream/45 hover:text-champagne text-[11px] uppercase tracking-[0.25em] inline-flex items-center"
          >
            ← Quiz-Uebersicht
          </Link>
        </div>

        <p className="eyebrow mb-3">Quiz</p>
        <h1 className="font-display italic text-cream text-3xl md:text-4xl leading-[1.05] tracking-[-0.02em] mb-3">
          {quiz.title}
        </h1>
        <p className="text-cream/60 text-base leading-relaxed mb-4">
          {quiz.intro}
        </p>
        {best && (
          <p className="text-champagne text-[10px] uppercase tracking-[0.25em] mb-10">
            Dein Best-Score: {best.score}/{best.max_score}
          </p>
        )}

        <QuizRunner quiz={quiz} />
      </main>
    </>
  );
}
