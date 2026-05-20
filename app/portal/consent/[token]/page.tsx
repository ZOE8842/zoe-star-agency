// Consent-Confirm-Page — User klickt Email-Link, Token wird konsumiert,
// profiles.allow_*_confirmed wird auf true gesetzt.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { invalidateShowcase } from "@/lib/showcase/invalidation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ t?: string }>;
}

interface ConsumeResult {
  ok: boolean;
  consent_type?: "showcase" | "brand_cooperation";
  error?: string;
}

async function consumeToken(profileId: string, token: string): Promise<ConsumeResult> {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: row } = await admin
    .from("consent_tokens")
    .select("id, profile_id, consent_type, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();

  if (!row) return { ok: false, error: "Token unbekannt." };
  if (row.profile_id !== profileId) {
    return { ok: false, error: "Token gehoert nicht zu diesem Account." };
  }
  if (row.used_at) return { ok: false, error: "Token bereits eingeloest." };
  if (new Date(row.expires_at) < new Date()) {
    return { ok: false, error: "Token abgelaufen." };
  }

  const consentType = row.consent_type as "showcase" | "brand_cooperation";
  const updateField = consentType === "showcase"
    ? { allow_website_showcase_confirmed: true, allow_website_showcase_confirmed_at: new Date().toISOString() }
    : { allow_partner_cooperations_confirmed: true, allow_partner_cooperations_confirmed_at: new Date().toISOString() };

  await admin.from("profiles").update(updateField).eq("id", profileId);
  await admin.from("consent_tokens").update({ used_at: new Date().toISOString() }).eq("id", row.id);

  return { ok: true, consent_type: consentType };
}

export default async function ConsentConfirmPage({ params }: Props) {
  const { token } = await params;
  const { profile } = await getAuthedProfile();
  if (!token) redirect("/portal/profile/showcase");

  const r = await consumeToken(profile.id, token);

  // CDX-1: Nur bei erfolgreichem Consume (allow_*_confirmed=true geschrieben)
  // Cache invalidieren. Bei deny / invalid / expired / error explizit NICHT,
  // weil keine Public-Visibility-Aenderung erfolgt ist.
  if (r.ok) {
    await invalidateShowcase();
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

      <main className="container-luxe relative z-10 py-16 md:py-24 max-w-xl text-center">
        <p className="eyebrow mb-4">Bestaetigung</p>

        {r.ok ? (
          <>
            <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
              {r.consent_type === "showcase"
                ? <>Deine Showcase-<span className="text-champagne">Freigabe steht.</span></>
                : <>Kooperations-<span className="text-champagne">Teilnahme bestaetigt.</span></>}
            </h1>
            <p className="text-cream/65 text-base md:text-lg leading-relaxed mb-10">
              {r.consent_type === "showcase"
                ? "Sobald Admin die Karte freigibt, erscheint sie auf zoe-star.de. Du kannst die Sichtbarkeit jederzeit im Profil deaktivieren."
                : "Wir kommen auf dich zu, sobald eine Anfrage zu deinem Profil passt. Du entscheidest immer selbst, ob du teilnimmst."}
            </p>
            <Link
              href="/portal/profile/showcase"
              className="btn-cta btn-shimmer"
            >
              Zum Profil
              <span className="btn-cta-arrow" aria-hidden>→</span>
            </Link>
          </>
        ) : (
          <>
            <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
              Hat <span className="text-champagne">nicht funktioniert.</span>
            </h1>
            <p className="text-cream/65 text-base md:text-lg leading-relaxed mb-2">
              {r.error}
            </p>
            <p className="text-cream/45 text-sm mb-10">
              Loesung: im Profil die Freigabe erneut speichern, dann kommt eine
              neue Bestaetigungs-Mail.
            </p>
            <Link
              href="/portal/profile/showcase"
              className="btn-cta btn-shimmer"
            >
              Zum Profil
              <span className="btn-cta-arrow" aria-hidden>→</span>
            </Link>
          </>
        )}
      </main>
    </>
  );
}
