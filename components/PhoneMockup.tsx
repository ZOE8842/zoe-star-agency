// PhoneMockup — vertikales iPhone-Frame mit TikTok-UI-Layer.
// CSS-only, keine echten Photos noetig. ROH > LEER.
// Wenn echte Video-IDs vorhanden → durch TikTokEmbed ersetzen.

interface PhoneMockupProps {
  username: string;
  displayName?: string;
  caption?: string;
  /** Likes-Count, default "12.4K" */
  likes?: string;
  /** Comments-Count, default "847" */
  comments?: string;
  /** Live-Badge top */
  live?: boolean;
  /** Visual-Style: "warm" / "cool" / "champagne" / "ink" */
  visual?: "warm" | "cool" | "champagne" | "ink";
  className?: string;
  /** rotation in degrees, fuer stack-effekte */
  rotation?: number;
  /** href: ganze card klickbar, oeffnet in neuem tab */
  href?: string;
}

const VISUAL_BG: Record<NonNullable<PhoneMockupProps["visual"]>, string> = {
  warm: "linear-gradient(165deg, #2a1810 0%, #4a2a18 40%, #1a0c08 100%)",
  cool: "linear-gradient(165deg, #0d1620 0%, #1a2840 50%, #050810 100%)",
  champagne: "linear-gradient(165deg, #2d2210 0%, #4d3818 40%, #1a1208 100%)",
  ink: "linear-gradient(165deg, #1a1a1a 0%, #0a0a0a 100%)",
};

export function PhoneMockup({
  username,
  displayName,
  caption = "Premium Creator Content",
  likes = "12.4K",
  comments = "847",
  live = false,
  visual = "ink",
  className = "",
  rotation = 0,
  href,
}: PhoneMockupProps) {
  const Wrapper = href ? "a" : "div";
  const wrapperProps = href
    ? { href, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`relative block ${className} ${href ? "cursor-pointer" : ""}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <div
        className="relative w-full aspect-[9/19] rounded-[36px] md:rounded-[44px] border-2 border-cream/15 overflow-hidden shadow-2xl"
        style={{ background: VISUAL_BG[visual] }}
      >
        {/* Subtle BG-Pattern für Visual-Tiefe */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background: "radial-gradient(ellipse 70% 50% at 30% 30%, rgba(201, 168, 106, 0.18), transparent 60%), radial-gradient(ellipse 60% 40% at 70% 80%, rgba(201, 168, 106, 0.10), transparent 60%)",
          }}
        />

        {/* Top: LIVE-Badge oder Notch-Indicator */}
        <div className="absolute top-3 left-0 right-0 flex justify-between items-center px-4 z-10">
          {live ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-white text-[10px] font-bold uppercase tracking-wider">Live</span>
            </span>
          ) : (
            <span className="inline-block w-16 h-1 rounded-full bg-cream/20" />
          )}
          <span className="text-cream/40 text-[10px] uppercase tracking-wider">
            For You
          </span>
        </div>

        {/* Center: Z-Watermark als Subjekt-Platzhalter */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/zoe_monogram_v3.svg"
            alt=""
            aria-hidden
            className="w-2/5 opacity-25 breathe"
          />
        </div>

        {/* Bottom-left: Username + Caption */}
        <div className="absolute bottom-3 left-3 right-16 z-10">
          <p className="text-white text-sm md:text-base font-bold mb-1 truncate">
            {username}
          </p>
          {displayName && (
            <p className="text-white/70 text-[10px] md:text-xs mb-1.5 truncate">
              {displayName}
            </p>
          )}
          <p className="text-white/85 text-xs md:text-sm leading-tight line-clamp-2">
            {caption}
          </p>
        </div>

        {/* Bottom-right: Action-Stack (Heart / Comment / Share) */}
        <div className="absolute bottom-3 right-3 flex flex-col items-center gap-3 z-10">
          {/* Profile-Circle */}
          <div className="w-9 h-9 rounded-full bg-champagne/20 border border-champagne/50 flex items-center justify-center">
            <span className="text-champagne text-xs font-display italic">
              {username.replace("@", "").slice(0, 1).toUpperCase()}
            </span>
          </div>

          {/* Heart */}
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white" aria-hidden>
              <path d="M12 21s-7-4.5-9-9c-1.5-3 0-7 4-7 2 0 4 1.5 5 3 1-1.5 3-3 5-3 4 0 5.5 4 4 7-2 4.5-9 9-9 9z" />
            </svg>
            <span className="text-white text-[10px] font-bold mt-0.5">{likes}</span>
          </div>

          {/* Comment */}
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white" aria-hidden>
              <path d="M21 12a8 8 0 0 1-12.4 6.7L3 21l2.3-5.6A8 8 0 1 1 21 12z" />
            </svg>
            <span className="text-white text-[10px] font-bold mt-0.5">{comments}</span>
          </div>

          {/* Share */}
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white" aria-hidden>
              <path d="M3 12l18-9-9 18-2-7-7-2z" />
            </svg>
          </div>
        </div>

        {/* Subtle vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            boxShadow: "inset 0 0 80px rgba(0, 0, 0, 0.5)",
          }}
        />
      </div>
    </Wrapper>
  );
}
