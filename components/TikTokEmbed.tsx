// TikTokEmbed — iframe-Wrapper fuer offizielle TikTok-Embeds.
// Drop-In wenn echte Video-IDs vorliegen.
// DSGVO-Hinweis: Click-to-Load-Pattern, Tracking-Cookies erst nach User-Aktion.
//
// Usage:
// <TikTokEmbed videoId="7241234567890123456" username="@zoe.star.agency" />

"use client";

import { useState } from "react";

interface TikTokEmbedProps {
  videoId: string;
  username: string;
  caption?: string;
  className?: string;
  /** "vertical" = full 9:16 player, "compact" = teaser-card mit click-to-load */
  variant?: "vertical" | "compact";
}

export function TikTokEmbed({
  videoId,
  username,
  caption,
  className = "",
  variant = "vertical",
}: TikTokEmbedProps) {
  const [loaded, setLoaded] = useState(false);

  if (variant === "compact" && !loaded) {
    return (
      <div className={`relative aspect-[9/19] rounded-[36px] md:rounded-[44px] border-2 border-cream/15 overflow-hidden bg-ink ${className}`}>
        <button
          type="button"
          onClick={() => setLoaded(true)}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 hover:bg-champagne/5 transition-colors group"
          aria-label={`Load TikTok ${username}`}
        >
          <div className="w-16 h-16 rounded-full bg-champagne/20 border border-champagne/40 flex items-center justify-center group-hover:bg-champagne/30 transition-colors">
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-champagne" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <p className="text-cream font-medium">{username}</p>
          {caption && <p className="text-cream/50 text-sm px-6 text-center">{caption}</p>}
          <p className="text-cream/35 text-[10px] uppercase tracking-[0.25em] mt-2">Tap to load TikTok</p>
        </button>
      </div>
    );
  }

  const cleanUsername = username.replace("@", "");
  const src = `https://www.tiktok.com/embed/v2/${videoId}?lang=de`;

  return (
    <div className={`relative aspect-[9/19] rounded-[36px] md:rounded-[44px] border-2 border-cream/15 overflow-hidden bg-ink ${className}`}>
      <iframe
        src={src}
        title={`TikTok ${username}`}
        allow="encrypted-media;"
        allowFullScreen
        loading="lazy"
        className="absolute inset-0 w-full h-full border-0"
      />
      {caption && (
        <div className="absolute bottom-2 left-2 right-2 z-10 pointer-events-none">
          <p className="text-cream/70 text-xs px-2 py-1 bg-ink/60 backdrop-blur-sm rounded">{cleanUsername} · {caption}</p>
        </div>
      )}
    </div>
  );
}
