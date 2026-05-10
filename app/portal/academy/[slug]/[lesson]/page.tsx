import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { CATEGORIES } from "@/lib/academy/data";
import { RenderBlocks } from "@/lib/academy/blocks";
import { LessonCompleteToggle } from "@/components/academy/LessonCompleteToggle";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string; lesson: string }>;
}

export default async function AcademyLessonPage({ params }: Props) {
  const { slug, lesson: lessonSlug } = await params;
  const { supabase, profile } = await getAuthedProfile();
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) notFound();
  const lesson = category.lessons.find((l) => l.slug === lessonSlug);
  if (!lesson) notFound();

  const { data: progress } = await supabase
    .from("academy_lesson_reads")
    .select("id")
    .eq("profile_id", profile.id)
    .eq("category_slug", slug)
    .eq("lesson_slug", lessonSlug)
    .maybeSingle();
  const isCompleted = !!progress;

  const idx = category.lessons.findIndex((l) => l.slug === lessonSlug);
  const prev = idx > 0 ? category.lessons[idx - 1] : null;
  const next = idx < category.lessons.length - 1 ? category.lessons[idx + 1] : null;

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
            href={`/portal/academy/${category.slug}`}
            className="text-cream/45 hover:text-champagne text-[11px] uppercase tracking-[0.25em] inline-flex items-center"
          >
            ← {category.title}
          </Link>
        </div>

        <p className="eyebrow mb-3">{category.title}</p>
        <h1 className="font-display italic text-cream text-3xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          {lesson.title}
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-2 max-w-xl">
          {lesson.summary}
        </p>
        <p className="text-cream/35 text-[10px] uppercase tracking-[0.25em] mb-10">
          {lesson.reading_minutes} Min Lesezeit
          {lesson.source_label && <> · Quelle {lesson.source_label}</>}
        </p>

        <article className="prose-zoe">
          <RenderBlocks blocks={lesson.blocks} />
        </article>

        <div className="mt-10 pt-6 border-t border-champagne/10">
          <LessonCompleteToggle
            categorySlug={category.slug}
            lessonSlug={lesson.slug}
            initialCompleted={isCompleted}
          />
        </div>

        <nav className="mt-16 pt-8 border-t border-champagne/15 flex items-center justify-between gap-4">
          {prev ? (
            <Link
              href={`/portal/academy/${category.slug}/${prev.slug}`}
              className="text-cream/55 hover:text-champagne text-sm group"
            >
              <span className="block text-cream/30 text-[10px] uppercase tracking-[0.25em] mb-1">
                ← Vorher
              </span>
              <span className="font-display italic">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/portal/academy/${category.slug}/${next.slug}`}
              className="text-cream/55 hover:text-champagne text-sm text-right group"
            >
              <span className="block text-cream/30 text-[10px] uppercase tracking-[0.25em] mb-1">
                Naechste →
              </span>
              <span className="font-display italic">{next.title}</span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </main>
    </>
  );
}
