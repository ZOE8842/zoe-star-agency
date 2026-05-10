import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { AccountAnalyseForm } from "./AccountAnalyseForm";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  submitted: "Eingereicht",
  queued: "Warteschlange",
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

export default async function AccountAnalyseHub() {
  const { supabase, profile } = await getAuthedProfile();

  const { data: rows } = await supabase
    .from("account_analyses")
    .select("id, target_tiktok_username, status, created_at, manual_note")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(30);

  const list = rows ?? [];
  const open = list.filter((r) => ["submitted", "queued", "processing"].includes(r.status));

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
            href="/portal/analyse"
            className="text-cream/45 hover:text-champagne text-[11px] uppercase tracking-[0.25em] inline-flex items-center"
          >
            ← Analyse
          </Link>
        </div>

        <p className="eyebrow mb-3">Account Analyse</p>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          Wie wirkt dein <span className="text-champagne">Auftritt?</span>
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-10 max-w-xl">
          Wir nehmen dein TikTok-Profil komplett auseinander: Display-Name,
          Bio, Profilbild, Top-Videos, Hook-Staerke, Branding-Konsistenz
          und geben dir konkrete Verbesserungs-Schritte.
        </p>

        <AccountAnalyseForm
          defaultUsername={profile.tiktok_username || ""}
          hasOpenAnalysis={open.length > 0}
        />

        {list.length > 0 && (
          <section className="mt-12">
            <p className="eyebrow mb-4">Verlauf</p>
            <ul className="space-y-3">
              {list.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/portal/analyse/account/${r.id}`}
                    className="border border-champagne/15 hover:border-champagne/40 hover:bg-champagne/5 p-4 md:p-5 transition-colors block"
                  >
                    <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
                      <p className="font-display italic text-cream text-lg">
                        @{r.target_tiktok_username}
                      </p>
                      <span className={`shrink-0 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] ${STATUS_TONE[r.status] ?? ""}`}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </div>
                    {r.manual_note && (
                      <p className="text-cream/55 text-sm italic truncate mb-1">„{r.manual_note}"</p>
                    )}
                    <p className="text-cream/35 text-[10px] uppercase tracking-[0.25em]">
                      {new Date(r.created_at).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
