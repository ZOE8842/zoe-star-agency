import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { ChangePasswordForm } from "./ChangePasswordForm";
import Link from "next/link";

export default async function ProfileSecurityPage() {
  const { profile } = await getAuthedProfile();

  return (
    <>
      <PortalNav
        displayName={profile.display_name}
        email={profile.email}
        avatarUrl={profile.avatar_url}
        isAdmin={profile.role === "admin"}
        isManager={profile.role === "manager"}
      />

      <main className="container-luxe py-12 md:py-16 max-w-xl mx-auto">
        <Link
          href="/portal/profile"
          className="text-cream/50 hover:text-champagne text-[10px] uppercase tracking-[0.3em] inline-flex items-center gap-2 mb-8 transition"
        >
          <span>←</span> Profile
        </Link>

        <p className="eyebrow mb-3">Security</p>
        <h1 className="heading-display text-3xl md:text-4xl mb-3">
          Change <span className="text-champagne">password.</span>
        </h1>
        <p className="text-cream/60 text-sm leading-relaxed mb-10">
          Wähle ein neues, eigenständiges Passwort. Mindestens 12 Zeichen.
          Verwende NIE dein TikTok-Passwort.
        </p>

        <ChangePasswordForm email={profile.email} />

        <div className="border border-champagne/15 p-6 mt-8 text-cream/60 text-xs leading-relaxed">
          <p className="eyebrow mb-3 text-champagne">Tipp</p>
          <p>
            Nutze einen Passwort-Manager (Bitwarden, 1Password, Apple Keychain).
            Lange Passwörter (16+ Zeichen) sind sicherer als kurze mit Sonderzeichen.
          </p>
        </div>
      </main>
    </>
  );
}
