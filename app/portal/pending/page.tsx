import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function PendingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, status, display_name, tiktok_username, onboarding_completed")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/portal/login?error=profile_missing");

  // Wenn Creator gar nicht pending ist, redirect ins Dashboard
  if (profile.role !== "creator" || profile.status !== "pending") {
    redirect("/portal");
  }
  // Wenn Onboarding noch offen ist, dorthin
  if (profile.onboarding_completed === false) {
    redirect("/portal/onboarding");
  }

  return (
    <>
      <div className="atelier-atmosphere" />
      <div className="atelier-grain" />

      <main className="relative z-10 min-h-screen flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md text-center">
          <Link href="/" className="block mb-10 mx-auto w-fit">
            <Logo variant="avatar" className="h-20" />
          </Link>

          <p className="eyebrow text-champagne mb-4">Aufnahme · Pending</p>

          <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-6">
            Du bist auf der <span className="text-champagne">Schwelle.</span>
          </h1>

          <div className="hairline-divider w-24 mx-auto mb-6" />

          <p className="text-cream/70 text-base md:text-lg leading-relaxed mb-3">
            {profile.display_name || "Creator"} — dein Profil ist eingerichtet
            und liegt bei uns zum letzten Check.
          </p>
          <p className="text-cream/55 text-sm md:text-base leading-relaxed mb-10">
            ZOE schaut sich deinen TikTok-Auftritt + die Antworten aus dem
            Onboarding an. Sobald wir dich freigeschaltet haben, faellt
            diese Seite weg und du landest direkt im Member-Bereich.
          </p>

          <div className="border border-champagne/20 px-6 py-5 mb-10 text-left">
            <p className="text-cream/45 text-[10px] uppercase tracking-[0.25em] mb-2">
              Was du heute schon machen kannst
            </p>
            <ul className="space-y-2 text-cream/75 text-sm leading-relaxed">
              <li>· TikTok-Profil aufraeumen (Bio, Profilbild, letztes Video)</li>
              <li>· Falls du Showcase willst: 1-2 Bilder bereitlegen</li>
              <li>· Erste LIVE-Zeit fuer naechste Woche planen</li>
            </ul>
          </div>

          <p className="text-cream/40 text-xs leading-relaxed mb-6">
            Frage offen? Schreib uns kurz — wir melden uns persoenlich.
          </p>

          <form action="/portal/logout" method="post">
            <button
              type="submit"
              className="text-cream/45 hover:text-champagne text-[10px] uppercase tracking-[0.25em]"
            >
              Ausloggen
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
