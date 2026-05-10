"use client";

// Follow-Prompt-Card — fordert Creator auf den Agency-Kanaelen
// zu folgen. Self-Report (Creator klickt 'habe gefolgt'),
// kein Auto-Verify. Dismissable.

import { useState, useTransition } from "react";
import {
  setFollowStatus,
  dismissFollowPrompt,
} from "@/app/portal/profile/follow-status/actions";

interface Props {
  followedInstagram: boolean;
  followedTiktok: boolean;
  followedTelegram: boolean;
}

const CHANNELS = [
  {
    key: "followed_zoe_instagram" as const,
    label: "Instagram",
    handle: "@starzagency_88",
    url: "https://www.instagram.com/starzagency_88",
  },
  {
    key: "followed_zoe_tiktok" as const,
    label: "TikTok",
    handle: "@zoe.star.agency",
    url: "https://www.tiktok.com/@zoe.star.agency",
  },
  {
    key: "followed_zoe_telegram" as const,
    label: "Telegram",
    handle: "ZOE Channel",
    url: "https://t.me/zoe_ejy",
  },
];

export function FollowPromptCard({
  followedInstagram, followedTiktok, followedTelegram,
}: Props) {
  const [, startTransition] = useTransition();
  const [hidden, setHidden] = useState(false);

  const status: Record<string, boolean> = {
    followed_zoe_instagram: followedInstagram,
    followed_zoe_tiktok: followedTiktok,
    followed_zoe_telegram: followedTelegram,
  };

  const allDone = followedInstagram && followedTiktok && followedTelegram;
  if (hidden || allDone) return null;

  const toggle = (key: typeof CHANNELS[number]["key"], next: boolean) => {
    startTransition(async () => {
      await setFollowStatus(key, next);
    });
  };

  const dismiss = () => {
    setHidden(true);
    startTransition(async () => {
      await dismissFollowPrompt();
    });
  };

  return (
    <section className="mb-12 md:mb-16 border border-champagne/15 p-5 md:p-7">
      <div className="flex items-baseline justify-between mb-4 gap-3">
        <p className="eyebrow">Folge ZOE</p>
        <button
          type="button" onClick={dismiss}
          className="text-cream/35 hover:text-cream text-[10px] uppercase tracking-[0.25em]"
        >
          spaeter
        </button>
      </div>
      <p className="font-display italic text-cream text-2xl md:text-3xl leading-tight mb-2">
        Bleib im <span className="text-champagne">ZOE Network.</span>
      </p>
      <p className="text-cream/60 text-sm md:text-base leading-relaxed mb-6 max-w-xl">
        Updates, neue Academy-Lektionen, Events, Trends — direkt ueber unsere
        Kanaele. Folge uns, klick danach 'Hab gefolgt'.
      </p>

      <ul className="space-y-2">
        {CHANNELS.map((c) => {
          const done = status[c.key];
          return (
            <li
              key={c.key}
              className="flex items-center justify-between gap-3 border-t border-champagne/10 pt-3"
            >
              <div className="min-w-0">
                <p className="text-cream text-sm md:text-base">
                  {c.label}{" "}
                  <span className="text-cream/45 text-xs">{c.handle}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!done && (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-champagne hover:text-champagne-300 text-[10px] uppercase tracking-[0.25em] px-2 py-1"
                  >
                    Oeffnen ↗
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => toggle(c.key, !done)}
                  className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] transition-colors ${
                    done
                      ? "bg-champagne text-ink hover:bg-champagne-300"
                      : "border border-champagne/30 text-cream/70 hover:border-champagne hover:text-cream"
                  }`}
                >
                  {done ? "✓ Gefolgt" : "Hab gefolgt"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
