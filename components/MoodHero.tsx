// MoodHero — visuelle Hero-Komposition fuer Portal-Pages.
// CSS-Gradient-Mesh + Z-Monogramm-Watermark. Ohne Photos
// (kommen mit Brand-Shoot, Phase Premium-2).

interface MoodHeroProps {
  eyebrow?: string;
  headline: React.ReactNode;
  tagline?: React.ReactNode;
  cta?: React.ReactNode;
  rightSlot?: React.ReactNode;
  className?: string;
}

export function MoodHero({
  eyebrow,
  headline,
  tagline,
  cta,
  rightSlot,
  className = "",
}: MoodHeroProps) {
  return (
    <section className={`relative overflow-hidden ${className}`}>
      {/* Glow-Mesh — Premium-Tiefe */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 70% 80% at 80% 30%, rgba(201, 168, 106, 0.18), transparent 60%),
            radial-gradient(ellipse 60% 60% at 10% 90%, rgba(201, 168, 106, 0.08), transparent 60%)
          `,
        }}
      />

      {/* Z-Watermark dezent */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/zoe_monogram_v3.svg"
        alt=""
        className="absolute pointer-events-none select-none opacity-[0.04] hidden md:block"
        style={{ top: "-80px", right: "-100px", width: "520px" }}
      />

      <div className="relative z-10 grid md:grid-cols-[1fr_auto] gap-8 md:gap-12 items-center">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-5 md:mb-7">{eyebrow}</p>}
          <h1 className="heading-display text-cream text-5xl md:text-7xl lg:text-8xl leading-[0.95]">
            {headline}
          </h1>
          {tagline && (
            <p className="text-cream/65 text-base md:text-lg leading-relaxed mt-5 md:mt-7 max-w-[44ch]">
              {tagline}
            </p>
          )}
          {cta && <div className="mt-8 md:mt-10">{cta}</div>}
        </div>

        {rightSlot && (
          <div className="shrink-0">{rightSlot}</div>
        )}
      </div>
    </section>
  );
}
