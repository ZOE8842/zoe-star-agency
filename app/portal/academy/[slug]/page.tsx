import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { CATEGORIES } from "@/lib/academy/data";
import { resolveGroupSlug } from "@/lib/academy/groups";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AcademyCategoryPage({ params }: Props) {
  const { slug } = await params;
  const { profile } = await getAuthedProfile();
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) {
    // Alter Kategorie-Slug aus der Zeit vor den Themengruppen: still
    // weiterleiten statt 404 zeigen. Betrifft offene Tabs, Lesezeichen und
    // Links, die schon irgendwo verschickt wurden.
    const ziel = resolveGroupSlug(slug);
    if (ziel) redirect(`/portal/academy/${ziel}`);
    notFound();
  }

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

      <main className="container-luxe relative z-10 py-12 md:py-16 pb-28 md:pb-16 max-w-2xl">
        <div className="mb-10">
          <Link
            href="/portal/academy"
            className="inline-flex items-center min-h-11 -ml-3 px-3 text-cream/60 hover:text-champagne text-xs uppercase tracking-[0.25em] transition-colors"
          >
            ← Academy
          </Link>
        </div>

        <p className="eyebrow mb-3">Kategorie</p>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          {category.title}
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-12 max-w-xl">
          {category.intro}
        </p>

        <ul className="space-y-3">
          {category.lessons.map((lesson) => (
            <li key={lesson.slug}>
              <Link
                href={`/portal/academy/${category.slug}/${lesson.slug}`}
                className="border border-champagne/15 hover:border-champagne/40 hover:bg-champagne/5 p-5 md:p-6 transition-colors block group"
              >
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <h2 className="font-display italic text-cream text-xl md:text-2xl leading-tight group-hover:text-champagne transition-colors">
                    {lesson.title}
                  </h2>
                  <span className="shrink-0 text-cream/35 text-[10px] uppercase tracking-[0.25em]">
                    {lesson.reading_minutes} min
                  </span>
                </div>
                <p className="text-cream/65 text-sm md:text-base leading-relaxed">
                  {lesson.summary}
                </p>
                {lesson.source_label && (
                  <p className="mt-3 text-cream/35 text-[10px] uppercase tracking-[0.25em]">
                    Quelle · {lesson.source_label}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
