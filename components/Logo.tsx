// ZOE Star Agency — Logo-Komponente
// Brand-Strategie (2026-05-17 Unification):
//   - Z⭐ Symbol = UI/Icon-Sprache (avatar / avatar-mini / monogram)
//     -> Source: Nesips finale PWA-Icons in /app-icons/
//   - ZOE Star Agency Wordmark = Brand/Header/Hero
//     -> Source: bestehende Lockup-SVGs in /brand/ (alt-Z im Wordmark)
//
// Avatar-Variante zeigt jetzt das finale kursive Z⭐ mit goldenem
// Kreis-Border. Vorher zeigte sie das alte Block-Z. Aenderung
// fliesst automatisch in alle 9 Verwendungsstellen ein (Login,
// Signup, Reset/Forgot/Pending, not-found, MoodHero,
// CreatorShowcaseCard, portal/page).

interface LogoProps {
  variant?: "avatar" | "avatar-mini" | "horizontal" | "horizontal-cream" | "monogram";
  className?: string;
  alt?: string;
}

const SOURCES: Record<NonNullable<LogoProps["variant"]>, string> = {
  // Z⭐ Symbol (Nesips finales Brand-Icon, kursives Z + goldener Ring)
  "avatar":           "/app-icons/icon-512.png",
  "avatar-mini":      "/app-icons/icon-192.png",
  "monogram":         "/app-icons/icon-512.png",
  // ZOE Star Agency Wordmark (bestehende Lockup-SVGs, separates Update offen)
  "horizontal":       "/brand/zoe_lockup_dark_v3.svg",
  "horizontal-cream": "/brand/zoe_lockup_v3.svg",
};

export function Logo({ variant = "horizontal", className = "h-8", alt = "ZOE Star Agency" }: LogoProps) {
  const src = SOURCES[variant];
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} />;
}
