// CreatorShowcaseCard — Premium Editorial Card mit eigener visueller Sprache.
// KEIN TikTok-UI, KEINE Likes/Comments/Shares/LIVE/Viewer-Zahlen.
// Vertikales Frame als Magazin-Cover. Subject = Bild ODER Z-Brand-Mark.

import Link from "next/link";
import { ArrowExternalIcon, TikTokIcon, InstagramIcon } from "./SocialIcons";

export interface CreatorShowcase {
  displayName: string;
  category?: string;
  imageSrc?: string;
  /** 2. Bild fuer Hover/Swipe-Wechsel (V2 · 2-Bild-Pflicht). */
  imageSrc2?: string;
  platform?: "tiktok" | "instagram" | null;
  href?: string;
  /** Interne Detail-URL · hat Vorrang ueber externe href. */
  profileHref?: string;
  visual?: "warm" | "cool" | "champagne" | "ink";
}

const VISUAL_BG: Record<NonNullable<CreatorShowcase["visual"]>, string> = {
  warm: "linear-gradient(165deg, #2a1810 0%, #4a2a18 40%, #1a0c08 100%)",
  cool: "linear-gradient(165deg, #0d1620 0%, #1a2840 50%, #050810 100%)",
  champagne: "linear-gradient(165deg, #2d2210 0%, #4d3818 40%, #1a1208 100%)",
  ink: "linear-gradient(165deg, #1a1a1a 0%, #0a0a0a 100%)",
};

interface Props extends CreatorShowcase {
  className?: string;
  /** rotation in degrees, fuer leicht versetzte Stack-Effekte */
  rotation?: number;
}

export function CreatorShowcaseCard({
  displayName,
  category,
  imageSrc,
  imageSrc2,
  platform,
  href,
  profileHref,
  visual = "ink",
  className = "",
  rotation = 0,
}: Props) {
  const platformLabel = platform === "tiktok" ? "TikTok" : platform === "instagram" ? "Instagram" : null;
  const PlatformIcon = platform === "tiktok" ? TikTokIcon : platform === "instagram" ? InstagramIcon : null;

  const inner = (
    <>
      <div
        className="relative w-full aspect-[3/4] border border-champagne/15 group-hover:border-champagne overflow-hidden transition-all duration-500"
        style={imageSrc ? undefined : { background: VISUAL_BG[visual] }}
      >
        {/* Echtes Bild ODER Subject-Platzhalter */}
        {imageSrc ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt={displayName}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-out group-hover:opacity-0"
            />
            {imageSrc2 && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageSrc2}
                alt=""
                aria-hidden
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out"
              />
            )}
          </>
        ) : (
          <>
            {/* Glow-Atmosphere */}
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden
              style={{
                background:
                  "radial-gradient(ellipse 70% 50% at 30% 35%, rgba(201, 168, 106, 0.20), transparent 60%)," +
                  "radial-gradient(ellipse 60% 40% at 70% 80%, rgba(201, 168, 106, 0.10), transparent 60%)",
              }}
            />
            {/* Z-Mark als Subject */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/zoe_monogram_v3.svg"
                alt=""
                aria-hidden
                className="w-1/2 opacity-25 breathe"
              />
            </div>
          </>
        )}

        {/* Editorial Bottom-Gradient für Text-Lesbarkeit */}
        <div
          className="absolute inset-x-0 bottom-0 h-2/5 pointer-events-none"
          aria-hidden
          style={{
            background: "linear-gradient(180deg, transparent 0%, rgba(10, 10, 10, 0.85) 75%, rgb(10, 10, 10) 100%)",
          }}
        />

        {/* Top: Eyebrow Category */}
        {category && (
          <div className="absolute top-4 left-4 right-4 z-10">
            <p className="text-cream/85 text-[10px] uppercase tracking-[0.3em]">
              {category}
            </p>
          </div>
        )}

        {/* Top-right: ZOE-Mark */}
        <div className="absolute top-4 right-4 z-10">
          <span className="text-champagne text-[10px] uppercase tracking-[0.3em] font-medium">
            ZOE⭐
          </span>
        </div>

        {/* Bottom: Displayname + Platform-Link */}
        <div className="absolute bottom-5 left-5 right-5 z-10">
          <h3 className="font-display italic text-cream text-2xl md:text-3xl leading-[1.05] mb-3 group-hover:text-champagne transition-colors">
            {displayName}
          </h3>
          {platformLabel && PlatformIcon && (
            <span className="inline-flex items-center gap-2 text-champagne text-[10px] uppercase tracking-[0.3em]">
              <PlatformIcon className="w-3.5 h-3.5" />
              <span>{platformLabel}</span>
              <ArrowExternalIcon className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          )}
        </div>
      </div>
    </>
  );

  const wrapperStyle = { transform: `rotate(${rotation}deg)` };
  const wrapperClass = `group relative block ${profileHref || href ? "cursor-pointer" : ""} ${className}`;

  // Internal-Detail (Next-Link) > external (a) > div
  if (profileHref) {
    return (
      <Link href={profileHref} className={wrapperClass} style={wrapperStyle}>
        {inner}
      </Link>
    );
  }
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={wrapperClass}
        style={wrapperStyle}
      >
        {inner}
      </a>
    );
  }
  return (
    <div className={wrapperClass} style={wrapperStyle}>
      {inner}
    </div>
  );
}
