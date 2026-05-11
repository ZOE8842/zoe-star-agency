import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { ApproveButtons } from "./ApproveButtons";

export const dynamic = "force-dynamic";

export default async function AdminPendingPage() {
  const { supabase, profile } = await requireAdmin();

  // Nur Creator anzeigen, die WIRKLICH zur Freigabe bereit sind:
  // role=creator + status=pending + onboarding_completed=true
  // → keine halbfertigen Signups in der Approval-Liste.
  const { data: pendingCreators } = await supabase
    .from("profiles")
    .select("id, display_name, tiktok_username, email, country, language, creator_category, live_format, onboarding_completed, onboarding_completed_at, joined_at, metadata")
    .eq("role", "creator")
    .eq("status", "pending")
    .eq("onboarding_completed", true)
    .order("onboarding_completed_at", { ascending: true });

  const list = pendingCreators ?? [];

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
        <div className="mb-6">
          <Link href="/portal/admin" className="text-cream/45 hover:text-champagne text-[11px] uppercase tracking-[0.25em]">
            ← Admin
          </Link>
        </div>
        <p className="eyebrow mb-3">Admin · Aufnahme</p>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          Pending <span className="text-champagne">Approvals.</span>
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-10 max-w-2xl">
          Creator die das Onboarding fertig haben + auf deine
          Freischaltung warten. Approve → voller Zugang + Inbox-Push.
        </p>

        {list.length === 0 && (
          <div className="border border-champagne/15 p-8 text-center">
            <p className="font-display italic text-cream/45 text-xl">
              Keine pending Creator gerade.
            </p>
            <p className="text-cream/35 text-sm mt-2">
              Sobald jemand das Onboarding abschliesst, erscheint er hier.
            </p>
          </div>
        )}

        <ul className="space-y-3">
          {list.map((c) => {
            const onbDate = c.onboarding_completed_at
              ? new Date(c.onboarding_completed_at).toLocaleDateString("de-DE", { day: "2-digit", month: "long" })
              : "—";
            const goals = (c.metadata as { goals?: string[] } | null)?.goals ?? [];
            return (
              <li key={c.id} className="border border-champagne/15 p-4 md:p-5">
                <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
                  <p className="font-display italic text-cream text-lg md:text-xl">
                    {c.display_name || "—"}{" "}
                    {c.tiktok_username && <span className="text-cream/45 text-sm">@{c.tiktok_username}</span>}
                  </p>
                  <span className="px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] border border-champagne/40 text-champagne shrink-0">
                    pending
                  </span>
                </div>
                <p className="text-cream/55 text-[11px] uppercase tracking-[0.22em] mb-3">
                  {c.email} {c.country && <>· {c.country}</>} {c.language && <>· {c.language}</>}
                  {c.creator_category && <> · {c.creator_category}</>}
                  {c.live_format && <> · {c.live_format}</>}
                </p>
                {goals.length > 0 && (
                  <p className="text-cream/65 text-sm mb-3">
                    Ziele: {goals.join(", ")}
                  </p>
                )}
                <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-champagne/10">
                  <span className="text-cream/35 text-[10px] uppercase tracking-[0.25em]">
                    Onboarding {onbDate} · Account {new Date(c.joined_at).toLocaleDateString("de-DE")}
                  </span>
                  <ApproveButtons profileId={c.id} />
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
