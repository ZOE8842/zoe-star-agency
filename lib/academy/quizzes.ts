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
        q: "Wie lange dauert ein Soft-Reach-Limit typischerweise?",
        options: [
          "Genau 24h (TikTok-Doku)",
          "1-3 Tage · Erfahrungswert · TikTok bestaetigt es nicht offiziell",
          "Genau 30 Tage",
          "Nicht klar definiert",
        ],
        correct: 1,
        explanation: "TikTok dokumentiert das nicht offiziell. Aus Agency-Praxis: meist 1-3 Tage. Wer Hard-Strike riskiert, sollte Account Status im Creator Center pruefen — das ist die offizielle Sicht.",
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

  // ─── INSIDER-QUIZZE V2.1 ─────────────────────────────────────────
  // Echte Agency-Erfahrung. Harte Wahrheit. Keine Schul-App-Sprache.

  {
    slug: "erste-15-minuten",
    category_slug: "live-grundlagen",
    title: "Die ersten 15 Minuten · Insider",
    intro: "Was Streams in den ersten Minuten kaputt macht — direkt aus echten Lives.",
    questions: [
      {
        q: "Was killt Watchtime am schnellsten in Minute 1?",
        options: [
          "Schlechtes Licht",
          "Stille + Setup-Gefummel",
          "Zu wenige Zuschauer",
          "Falsche Musik",
        ],
        correct: 1,
        explanation: "Stille + 'Moment, ich muss noch was richten' in Min. 1 = Algo droppt sofort. Setup MUSS vor Stream-Start fertig sein.",
      },
      {
        q: "Was passiert wenn du direkt zu Beginn matchst?",
        options: [
          "Mehr Reichweite",
          "Zuschauerbindung sinkt — Stream wirkt 'unfertig'",
          "Algo boostet immer",
          "Egal, Hauptsache aktiv",
        ],
        correct: 1,
        explanation: "Match in Min. 1-5 = du gewinnst Match-Volumen, verlierst aber Zuschauer die noch nicht 'angekommen' sind. Erst 10-15 Min warm-up.",
      },
      {
        q: "Warum sind die ersten 15 Minuten kritisch?",
        options: [
          "Persoenliche Aufwaerm-Phase",
          "TikTok testet Watchtime + Interaktion + entscheidet Reach",
          "Sound-Check",
          "Mods muessen reinkommen",
        ],
        correct: 1,
        explanation: "Algo macht in den ersten Minuten Reach-Decision. Wer hier verkackt, kriegt nichts mehr fuer den Rest des Streams.",
      },
      {
        q: "Was ist schlimmer als wenige Zuschauer?",
        options: [
          "Schlechtes Licht",
          "Tote Zuschauer ohne Interaktion",
          "Falsche Tageszeit",
          "Falscher Titel",
        ],
        correct: 1,
        explanation: "20 stille Zuschauer killen die Stream-Metriken haerter als 5 aktive. Algo wertet Engagement, nicht Anzahl.",
      },
      {
        q: "Was ist die Pflicht in den ersten 60 Sekunden?",
        options: [
          "Cover-Story erzaehlen",
          "Aktiv sprechen + ersten Zuschauer namentlich begruessen",
          "Erst still beobachten",
          "Sofort um Geschenke fragen",
        ],
        correct: 1,
        explanation: "Sofort aktiv + Namen lesen. Selbst wenn nur 1 Zuschauer da ist: ansprechen. Stille = Tod.",
      },
    ],
  },

  {
    slug: "match-fehler",
    category_slug: "battles-matches",
    title: "Match-Fehler · die typischen",
    intro: "Was Matches kaputt macht — Agency-Sicht.",
    questions: [
      {
        q: "Warum sind immer gleiche Matchpartner schlecht?",
        options: [
          "Verstoss gegen TikTok-Regeln",
          "Zuschauer langweilen sich + weniger Reichweite",
          "Algo gibt Strafpunkte",
          "Eigentlich kein Problem",
        ],
        correct: 1,
        explanation: "Wiederholte Partner = Zuschauer kennen den Ablauf, Spannung weg. Algo merkt geringere Watchtime.",
      },
      {
        q: "Was ist ein toxischer Matchpartner?",
        options: [
          "Hat weniger Zuschauer als du",
          "Spielt nicht mit, beleidigt Zuschauer, will nur seine Mods",
          "Gewinnt zu oft",
          "Hat schlechtes Licht",
        ],
        correct: 1,
        explanation: "Toxisch = nimmt deine Energie + Community runter. Erkennen + raus + auf Block-Liste.",
      },
      {
        q: "Was tust du nach einem verlorenen Match?",
        options: [
          "Sofort neuen Match starten",
          "Stream beenden",
          "Energie halten, danken, naechstes Thema sofort",
          "Kurz pausieren, dann weiter",
        ],
        correct: 2,
        explanation: "Match endet, Stream wirkt 'fertig' = Drop-Point. Naechstes Mini-Thema MUSS innerhalb 30 Sek anlaufen.",
      },
      {
        q: "Wie waehlst du gute Matchpartner?",
        options: [
          "Aehnliches Zuschauerlevel + komplementaere Energie",
          "Immer staerker als du",
          "Immer schwaecher als du",
          "Egal, Hauptsache Match",
        ],
        correct: 0,
        explanation: "Aehnliche Groesse = fairer Battle. Komplementaere Energie = nicht 2× ruhig, nicht 2× laut. Mix wirkt.",
      },
      {
        q: "Wann ist 2vs2 sinnvoller als 1vs1?",
        options: [
          "Immer",
          "Wenn beide Streams kleine Zahlen haben + sich kombinieren wollen",
          "Nie, 1vs1 ist immer besser",
          "Nur an Wochenenden",
        ],
        correct: 1,
        explanation: "2vs2 = beide Audiences vereint. Bei kleinen Streams Hebel. Bei grossen kann es chaotisch wirken.",
      },
    ],
  },

  {
    slug: "tiktok-strikes",
    category_slug: "shadowban-sicherheit",
    title: "Strikes + Risiken · Agency-Wissen",
    intro: "Was im LIVE wirklich gefaehrlich ist — nicht was die Public-Regel sagt.",
    questions: [
      {
        q: "Was ist Gift-Baiting?",
        options: [
          "Geschenk-Galerie zeigen",
          "Tricks/Versprechen um Geschenke zu kriegen (Tanz pro Geschenk etc.)",
          "Geschenkgeber begruessen",
          "Geschenke selbst verschicken",
        ],
        correct: 1,
        explanation: "Konkrete Gegenleistung versprechen = Verstoss. 'Bei 100 Roses zieh ich aus' = Sofort-Sperre + Account-Risiko.",
      },
      {
        q: "Was ist im LIVE-Hintergrund problematisch?",
        options: [
          "Pflanzen",
          "Alkohol-Flaschen, Zigaretten, sichtbare Marken",
          "Helle Wand",
          "Spiegel",
        ],
        correct: 1,
        explanation: "Alkohol + Zigaretten im Bild = Reach-Drosselung. Selbst wenn du nichts trinkst. Hintergrund pruefen!",
      },
      {
        q: "Welche Filter sind LIVE-sicher?",
        options: [
          "Alle Filter",
          "Nur dezente Haut/Licht-Filter — keine starken Beauty-Filter",
          "Keine Filter, immer raw",
          "Nur TikTok-eigene Filter",
        ],
        correct: 1,
        explanation: "Starke Beauty-Filter werden manchmal als 'misleading' geflagged. Dezent ist sicher, krass ist Risiko.",
      },
      {
        q: "Wenn du eine Sperre bekommst — was ist der falscheste Move?",
        options: [
          "24h Pause + Appeal",
          "Sofort mit anderem Account weitermachen",
          "Mod kontaktieren",
          "Stream-Logs sichern",
        ],
        correct: 1,
        explanation: "Multi-Account-Workaround = beide Accounts gehen drauf. TikTok erkennt Geraet + IP. Pause + Appeal ist der einzige saubere Weg.",
      },
      {
        q: "Was triggert oft unerwartete Strikes?",
        options: [
          "Lange Stream-Dauer",
          "Versehentlich gezeigte 18+ Inhalte (Buch-Cover, Tattoo, Chat)",
          "Zu viele Mods",
          "Zu viele Battles",
        ],
        correct: 1,
        explanation: "Hintergrund-Details + Chat-Texte werden gescannt. Buch-Cover, T-Shirt-Aufschrift, Chat-Worte = unerwarteter Strike-Source.",
      },
    ],
  },

  {
    slug: "auszahlung-system",
    category_slug: "tiktok-geschenke",
    title: "Auszahlung · was wirklich zaehlt",
    intro: "TikTok-Auszahlungs-Logik. Insider-Werte.",
    questions: [
      {
        q: "Wann zaehlt ein LIVE-Tag als 'gueltig'?",
        options: [
          "Wenn du live warst",
          "Mind. 25 Min real-time LIVE pro Tag",
          "Mind. 60 Min pro Stream",
          "Mind. 100 Zuschauer",
        ],
        correct: 1,
        explanation: "Ab 25 Min real-time wird der Tag offiziell gezaehlt. Darunter = Tag verloren, egal wie aktiv du warst.",
      },
      {
        q: "Was bringt mehr Reach: ein 30-Min-Stream oder drei 10-Min-Streams?",
        options: [
          "Drei 10-Min-Streams",
          "Ein 30-Min-Stream",
          "Egal",
          "Drei sind besser fuer Algo",
        ],
        correct: 1,
        explanation: "Offiziell zaehlt ein Stream ab 25 Min real-time fuer Boni (Creator-Center). Erfahrungswert aus Agency-Praxis: durchgaengige 60-90 Min performen meist besser als mehrere kurze Stream-Stuecke. TikTok bestaetigt das aber nicht offiziell.",
      },
      {
        q: "Was ist die wichtigste Wochen-Mission fuer kleine Streamer?",
        options: [
          "Most-Streams-this-week",
          "Gueltige Live-Tage erfuellen + neue Follower",
          "Diamanten-Volume",
          "Match-Anzahl",
        ],
        correct: 1,
        explanation: "Wochen-Bonus kommt aus Konstanz, nicht Volumen. Lieber 5 stabile Tage als 2 Mega-Streams.",
      },
      {
        q: "Wann sollte man Stream-Pause machen wenn die Diamanten ausbleiben?",
        options: [
          "Nach 30 Min ohne Geschenk",
          "Gar nicht — durchhalten + Stamm-Zuschauer aktivieren",
          "Nach jedem Verlust",
          "Sofort wenn keiner kommt",
        ],
        correct: 1,
        explanation: "Kein-Geschenk-Phase ist Test fuer Stamm-Zuschauer-Bindung. Durchhalten, persoenlich werden, dranbleiben.",
      },
      {
        q: "Warum sind Monatsende + Wochenende wichtig?",
        options: [
          "Algorithmus boostet mehr",
          "Bonus-Aktionen + Event-Geschenke + mehr Zuschauer-Volumen",
          "Mehr Mods online",
          "Mehr Battles verfuegbar",
        ],
        correct: 1,
        explanation: "Plattform-Aktionen + Event-Multiplier + Zuschauer haben mehr Zeit. Schlechtere Wahl: Mittwoch nachts.",
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
