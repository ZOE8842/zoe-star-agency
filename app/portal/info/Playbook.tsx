"use client";

import { useState } from "react";

interface SectionItem {
  title: string;
  items: string[];
  hint?: string;
}

const TABS: Array<{ id: string; label: string; sections: SectionItem[] }> = [
  {
    id: "vor",
    label: "Vor dem LIVE",
    sections: [
      {
        title: "LIVE planen",
        items: [
          "Informiere deine Community bevor du live gehst",
          "Nutze Story, Video, Gruppen oder Channel",
          "Uhrzeit frueh genug ankuendigen",
          "Zuschauer vorbereiten",
        ],
      },
      {
        title: "Thema + Ablauf ueberlegen",
        items: [
          "Matchpartner vorher klaeren",
          "1vs1 oder 2vs2 festlegen",
          "Musik, Licht und Location pruefen",
          "Ziel vom Stream festlegen",
          "Kein planloses LIVE starten",
        ],
        hint: "Beispiele: Smalltalk · Kochen · Spaziergang · Battle-Abend · Community-Talk · Eventpush",
      },
      {
        title: "Setup pruefen",
        items: [
          "WLAN testen",
          "Akku / Ladekabel pruefen",
          "Licht kontrollieren",
          "Kamera sauber machen",
          "TikTok-App vorher oeffnen",
        ],
      },
    ],
  },
  {
    id: "waehrend",
    label: "Waehrend dem LIVE",
    sections: [
      {
        title: "Die ersten Minuten",
        items: [
          "Direkt aktiv starten",
          "Zuschauer begruessen",
          "Nicht still sein",
          "Energie zeigen",
          "Ziel vom LIVE sagen",
        ],
      },
      {
        title: "Im Stream",
        items: [
          "Namen lesen",
          "Mit Zuschauern reden",
          "Keine langen AFK-Phasen",
          "Spannung halten",
          "Community einbinden",
        ],
      },
    ],
  },
  {
    id: "nach",
    label: "Nach dem LIVE",
    sections: [
      {
        title: "Reaktivierung",
        items: [
          "Supportern danken",
          "Kurze Nachrichten schicken",
          "Highlights posten",
          "Story hochladen",
          "Gute Momente speichern",
          "Stream kurz analysieren",
        ],
      },
    ],
  },
  {
    id: "taeglich",
    label: "Taeglich",
    sections: [
      {
        title: "Taegliche Aufgaben",
        items: [
          "LIVE gehen",
          "Story posten",
          "Community antworten",
          "TikTok aktiv halten",
          "Andere Creator beobachten",
        ],
      },
    ],
  },
  {
    id: "woechentlich",
    label: "Woechentlich",
    sections: [
      {
        title: "Woechentliche Aufgaben",
        items: [
          "LIVE-Zeiten planen",
          "Neue Matchpartner suchen",
          "Profil verbessern",
          "Highlights hochladen",
          "Ziele pruefen",
          "Analytics anschauen",
        ],
      },
    ],
  },
];

export function Playbook() {
  const [active, setActive] = useState(TABS[0].id);
  const tab = TABS.find((t) => t.id === active)!;

  return (
    <div>
      {/* Tab-Bar — horizontal scroll auf Mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 -mx-2 px-2 md:mx-0 md:px-0 md:flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`shrink-0 px-4 py-2.5 text-[11px] uppercase tracking-[0.22em] transition-colors border ${
              active === t.id
                ? "border-champagne bg-champagne text-ink"
                : "border-champagne/20 text-cream/65 hover:border-champagne/50 hover:text-champagne"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {tab.sections.map((s, i) => (
          <section key={i} className="border-l border-champagne/30 pl-5 md:pl-6">
            <p className="eyebrow mb-3">{s.title}</p>
            <ul className="space-y-2.5">
              {s.items.map((item, j) => (
                <li key={j} className="text-cream/85 text-sm md:text-base leading-relaxed flex gap-3">
                  <span className="shrink-0 text-champagne/60">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {s.hint && (
              <p className="text-cream/45 text-xs mt-3 italic">{s.hint}</p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
