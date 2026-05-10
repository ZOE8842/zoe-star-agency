// Academy Quizzes V1 — echte Multiple-Choice-Fragen.
// V2: optional in DB migrieren + Admin-Edit.

export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
  explanation?: string;
}

export interface Quiz {
  slug: string;
  category_slug: string;
  title: string;
  intro: string;
  questions: QuizQuestion[];
}

export const QUIZZES: Quiz[] = [
  {
    slug: "tiktok-regeln-basics",
    category_slug: "tiktok-regeln",
    title: "TikTok Regeln · Basics",
    intro: "5 Fragen ueber die wichtigsten Regeln. Schnell — keine Fallen.",
    questions: [
      {
        q: "Welcher Stream wird am schnellsten gesperrt?",
        options: [
          "Lange Pause ohne Sprechen",
          "Underwear-Stream",
          "Battle ohne Mod",
          "Schlechtes Licht",
        ],
        correct: 1,
        explanation: "Nudity / suggestive Kleidung ist Hard-Stop. Sofort-Sperre.",
      },
      {
        q: "Was passiert wenn du eine andere Live-App offen bewirbst?",
        options: [
          "Nichts, sind ja deine Follower",
          "Reichweite minus, evtl Sperre",
          "Du bekommst Bonus-Diamonds",
          "TikTok schickt Warnung per Mail",
        ],
        correct: 1,
        explanation: "Konkurrenz-Plattformen offen bewerben triggert Reach-Drosselung bis Account-Sperre.",
      },
      {
        q: "Wann brauchst du einen aktiven Mod?",
        options: [
          "Erst ab 1000 Zuschauern",
          "Nur bei Battles",
          "Spaetestens ab 50 stabilen Zuschauern",
          "Nie, ich kann selbst moderieren",
        ],
        correct: 2,
        explanation: "Ab 50 stabilen Zuschauern wird Mod-Pflicht — Spam + Hate brauchen sofortige Reaktion.",
      },
      {
        q: "Soft-Shadowban — wie lange dauert es?",
        options: [
          "1 Stunde",
          "24-72h",
          "Min. 30 Tage",
          "Permanent",
        ],
        correct: 1,
        explanation: "Soft-Limit ist meist 24-72h. Wenn ignoriert, kann es zu Hard-Limit eskalieren.",
      },
      {
        q: "Erster Schritt bei Sperre-Verdacht?",
        options: [
          "Sofort neu live gehen",
          "Anderes Handy nutzen",
          "Stream beenden, App schliessen, 24h Pause",
          "TikTok per Mail beschimpfen",
        ],
        correct: 2,
        explanation: "Stream stoppen + 24h Pause + App-Cache leeren. Nicht versuchen weiterzumachen.",
      },
    ],
  },
  {
    slug: "live-grundlagen-basics",
    category_slug: "live-grundlagen",
    title: "LIVE Grundlagen · Basics",
    intro: "5 Fragen ueber Setup + erste 60 Sekunden.",
    questions: [
      {
        q: "Wann sollte das Technik-Setup fertig sein?",
        options: [
          "5 Min vor Stream",
          "15 Min vor Stream",
          "Waehrend des Streams",
          "Eine Stunde vor Stream",
        ],
        correct: 1,
        explanation: "15 Min Puffer fuer Speedtest, Mikro-Check, Licht, mental.",
      },
      {
        q: "Stream-Titel — was funktioniert besser?",
        options: [
          "Kommt vorbei",
          "Hi alle :)",
          "Match gegen Selin 21:00",
          "Streame jetzt",
        ],
        correct: 2,
        explanation: "Spezifisch + konkret zieht mehr Klicks als generisch.",
      },
      {
        q: "Erste 60 Sekunden — was killt sofort?",
        options: [
          "Direkt loslegen",
          "Schweigen + Setup-Fixerei",
          "Klare Aussage was passiert",
          "Frage stellen",
        ],
        correct: 1,
        explanation: "Tote Pausen in den ersten 60 Sek lassen Joiner sofort wieder gehen.",
      },
      {
        q: "Wer entscheidet ob du mehr Reichweite bekommst?",
        options: [
          "TikTok Support",
          "Deine Follower",
          "Der Algorithmus, basierend auf fruehen Joinern",
          "Die Tageszeit",
        ],
        correct: 2,
        explanation: "Algorithmus testet anhand erster Joiner. Bleiben sie → mehr Reach. Gehen sie → Drosselung.",
      },
      {
        q: "Was gehoert in die mentale Vorbereitung?",
        options: [
          "Nichts, einfach loslegen",
          "Hook-Satz + 3 Themen + 1 CTA",
          "5 Stunden ueben",
          "Skript komplett auswendig lernen",
        ],
        correct: 1,
        explanation: "Hook + Themen + CTA reichen. Skript-Lesen wirkt steif.",
      },
    ],
  },
  {
    slug: "watchtime-basics",
    category_slug: "watchtime",
    title: "Watchtime · Basics",
    intro: "5 Fragen ueber die wichtigste LIVE-Metrik.",
    questions: [
      {
        q: "Was ist Watchtime?",
        options: [
          "Anzahl Zuschauer",
          "Wie lange Zuschauer durchschnittlich bleiben",
          "Wie lange du streamst",
          "Wie viele Diamonds pro Minute",
        ],
        correct: 1,
        explanation: "Watchtime = durchschnittliche Verweildauer. Wichtiger als reine Zuschauerzahl.",
      },
      {
        q: "Was hebt Watchtime?",
        options: [
          "Sagen 'Ich beende gleich'",
          "Spannung aufbauen + 'gleich kommt was'",
          "Lange Pausen",
          "Negative Kommentare ignorieren",
        ],
        correct: 1,
        explanation: "Spannung + Storyfetzen + Versprechen halten Zuschauer.",
      },
      {
        q: "Was killt Watchtime sofort?",
        options: [
          "Aktive Community-Interaktion",
          "Tote Phasen 30+ Sekunden",
          "Klare Stream-Stimmung",
          "Klares Setup",
        ],
        correct: 1,
        explanation: "Tote Phasen sind Watchtime-Killer Nummer 1.",
      },
      {
        q: "Faktor zwischen 'Reach mit guter Watchtime' und 'Reach mit schlechter Watchtime'?",
        options: [
          "1.2x",
          "Etwa 5x mehr neue Joiner",
          "Macht keinen Unterschied",
          "Halbiert nur",
        ],
        correct: 1,
        explanation: "Guter Stream mit 2 min avg vs 20 sek avg → ca. 5x mehr neue Zuschauer.",
      },
      {
        q: "Was solltest du NIE sagen?",
        options: [
          "Hallo neuer Joiner",
          "Gleich Match",
          "Ich beende gleich",
          "Bleib dabei",
        ],
        correct: 2,
        explanation: "'Ich beende gleich' kostet sofort Zuschauer. NIE im Voraus ansagen.",
      },
    ],
  },
  {
    slug: "geschenke-basics",
    category_slug: "tiktok-geschenke",
    title: "TikTok Geschenke · Werte",
    intro: "5 Fragen ueber Gift-Werte. Schnell-Check fuer Stream-Praxis.",
    questions: [
      {
        q: "Eine Rose hat wie viele Diamonds?",
        options: ["1", "5", "10", "100"],
        correct: 0,
        explanation: "Rose = 1 Diamond. Minigeste.",
      },
      {
        q: "Rocking Horse — wie hoch?",
        options: ["100", "500", "1000", "5000"],
        correct: 2,
        explanation: "Rocking Horse = 1000 Diamonds. Erstes 4-stelliges Gift.",
      },
      {
        q: "Was bekommst du vom Coin-Preis als Creator?",
        options: [
          "100%",
          "Ungefaehr 50% als Diamond",
          "Nur 10%",
          "TikTok zahlt extra",
        ],
        correct: 1,
        explanation: "TikTok behaelt grob 50%, du bekommst Diamonds.",
      },
      {
        q: "TikTok Universe — was kostet das Zuschauer?",
        options: ["999 Coins", "4999 Coins", "44999 Coins", "100000 Coins"],
        correct: 2,
        explanation: "TikTok Universe = 44999 Coins. Top-Tier-Gift.",
      },
      {
        q: "Wie sollst du Geschenke aktiv einfordern?",
        options: [
          "Direkt 'schickt mir XY' rufen",
          "Bitte um konkrete Diamond-Zahl",
          "Gar nicht — Kontext schaffen + entstehen lassen",
          "Pro Stream eine Hauptgift-Kampagne",
        ],
        correct: 2,
        explanation: "Aktives Betteln wirkt billig und triggert Algorithmus-Down.",
      },
    ],
  },
];

export function bestScoreForUser(attempts: Array<{ quiz_slug: string; score: number; max_score: number }>): Map<string, { score: number; max_score: number }> {
  const map = new Map<string, { score: number; max_score: number }>();
  for (const a of attempts) {
    const prev = map.get(a.quiz_slug);
    if (!prev || a.score > prev.score) {
      map.set(a.quiz_slug, { score: a.score, max_score: a.max_score });
    }
  }
  return map;
}
