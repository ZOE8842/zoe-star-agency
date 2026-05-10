// ZOE Academy — V1 Inhaltsstruktur als TypeScript-Konstanten.
// Echte Inhalte basierend auf Backstage-Schulung, Lark-Kursen,
// TikTok-LIVE-Deutschland-Account-Beobachtung und ZOE-Standards.
// V2: optional in DB-Tabelle migrieren + Admin-Edit-UI.

import type { LessonBlock } from "./blocks";

export interface Lesson {
  slug: string;
  title: string;
  summary: string;
  reading_minutes: number;
  source_label?: string;
  blocks: LessonBlock[];
}

export interface Category {
  slug: string;
  title: string;
  intro: string;
  lessons: Lesson[];
}

export interface Gift {
  slug: string;
  name: string;
  diamonds: number;
  coins: number;
  description: string;
  use_case: string;
}

// ============================================================
//  KATEGORIEN
// ============================================================

export const CATEGORIES: Category[] = [
  {
    slug: "tiktok-regeln",
    title: "TikTok Regeln",
    intro:
      "Was du sicher wissen musst, bevor du LIVE gehst. Community Guidelines, LIVE-spezifische Regeln und was sofort sperrgefaehrdet ist.",
    lessons: [
      {
        slug: "community-guidelines-kompakt",
        title: "Community Guidelines — kompakt",
        summary:
          "Die zehn wichtigsten TikTok-Regeln in Klartext. Kein PDF — direkt anwendbar.",
        reading_minutes: 6,
        source_label: "TikTok offiziell + ZOE-Erfahrung",
        blocks: [
          { type: "lead", text: "TikTok-Regeln aendern sich oft. Diese Liste ist die kompakte Live-Version, die wir mit unseren Creator wirklich durchgehen." },
          { type: "h2", text: "Was sofort sperrt" },
          { type: "ul", items: [
            "Nudity, sexuelle Anspielungen, Underwear-Only-Streams",
            "Glücksspiel, Wetten, fake giveaways",
            "Drogen, Alkohol-im-Stream, gefaehrliche Stunts",
            "Hassrede, Diskriminierung, Bullying",
            "Minderjaehrige im LIVE oder Behauptung minderjaehrig zu sein",
            "Unerlaubtes Geld-Sammeln (Spenden ohne Genehmigung)",
            "Andere Plattformen offen bewerben (vor allem konkurrierende Live-Apps)",
          ] },
          { type: "h2", text: "Was problematisch wird" },
          { type: "ul", items: [
            "Reines Schlafen / inaktive Streams",
            "Auto-Generated-Content / nur Loop-Videos im LIVE",
            "Audio mit copyrighted Musik ohne Lizenz",
            "Politische Aussagen zu kontroversen Themen",
            "Kinder im Hintergrund unscharf — bitte nicht",
          ] },
          { type: "callout", text: "Bei Unsicherheit: vor LIVE im Management nachfragen. Lieber 30 Sekunden zoegern als 30 Tage Sperre." },
          { type: "h2", text: "Was du im Konflikt-Fall tust" },
          { type: "ol", items: [
            "Stream sofort beenden",
            "Screenshot + Zeit notieren",
            "Bei ZOE Service 'Problem melden' eintragen (Achtung: Modul folgt — bis dahin direkt im Management melden)",
            "Nicht versuchen, sofort wieder live zu gehen",
            "Auf Antwort des Managements warten",
          ] },
          { type: "quote", text: "Die strengsten 5 Regeln kennen ist mehr wert als 50 Regeln zu schaetzen.", source: "ZOE Standard" },
        ],
      },
      {
        slug: "live-spezifische-regeln",
        title: "LIVE-spezifische Regeln",
        summary:
          "Was im LIVE strenger gilt als in Videos. Watchtime-Pflicht, Inaktivitaet, Werbeverbote, Mod-Pflicht.",
        reading_minutes: 5,
        source_label: "TikTok LIVE Deutschland (analysiert)",
        blocks: [
          { type: "lead", text: "TikTok behandelt LIVE strenger als Feed-Videos. Hier die Punkte, die in Backstage-Trainings immer wieder genannt werden." },
          { type: "h3", text: "Mindest-Aktivitaet" },
          { type: "p", text: "Du musst sichtbar aktiv sein. Sprechen, in die Kamera schauen, mit der Community interagieren. Reines Stillsitzen oder 'AFK' wird zunehmend von TikTok als nicht-engagiert markiert und Reichweite gedrosselt." },
          { type: "h3", text: "Watchtime-Logik" },
          { type: "p", text: "Wenn Zuschauer schnell wieder gehen, gibt TikTok dir weniger neue Zuschauer. Erste 30 Sekunden eines neuen Joiners entscheiden. Begruessen, kurze Hook, klare Aussage was im LIVE passiert." },
          { type: "h3", text: "Werbeverbote" },
          { type: "ul", items: [
            "Keine Werbung fuer andere Live-Apps",
            "Keine Affiliate-Links in der Beschreibung",
            "Keine OnlyFans-/Patreon-Verweise",
            "Keine Telegram-/Discord-Links offen ansagen",
          ] },
          { type: "h3", text: "Mod-Pflicht" },
          { type: "p", text: "Bei groesseren LIVES gehoert mindestens ein aktiver Moderator dazu. Spam-Kommentare sofort entfernen, Hassrede bannen, Verdaechtige (z.B. fake gift scams) raus." },
          { type: "callout", text: "Faustregel: ab 50 stabilen Zuschauern brauchst du Mod-Support. Sprich vorher mit ZOE — wir haben Mod-Support-Pool." },
        ],
      },
      {
        slug: "shadowban-vermeiden",
        title: "Shadowban erkennen + vermeiden",
        summary:
          "Drei Stufen Shadowban — wie du erkennst dass du betroffen bist und wie du wieder rauskommst.",
        reading_minutes: 5,
        blocks: [
          { type: "lead", text: "Shadowban ist meist nicht angekuendigt. Du merkst es an stagnierender Reichweite, plotzlich wenig neuen Zuschauern und tot wirkenden Streams." },
          { type: "h2", text: "3 Stufen" },
          { type: "ol", items: [
            "Soft-Limit: Reichweite halbiert, Stream laeuft aber. Dauer 24-72h.",
            "LIVE-Sperre: kein LIVE-Button mehr verfuegbar. Dauer 7-30 Tage je nach Verstoss.",
            "Account-Sperre: kompletter Account betroffen. Loesung nur via TikTok-Support, nicht ueber ZOE.",
          ] },
          { type: "h2", text: "Was du sofort tust" },
          { type: "ul", items: [
            "Stream beenden",
            "App komplett schliessen, nicht im Hintergrund",
            "24h Pause — keine LIVES, keine Posts",
            "Cache + temp-Dateien der App leeren",
            "Mit anderem WLAN/Mobile-Daten neu testen (nach Pause)",
            "ZOE 'Problem melden' fuer Diagnose",
          ] },
          { type: "callout", text: "Wichtig: niemals einfach 'normal weitermachen'. Soft-Limit wird Hard-Limit wenn du den Algorithmus ignorierst." },
        ],
      },
    ],
  },

  {
    slug: "live-grundlagen",
    title: "LIVE Grundlagen",
    intro:
      "Was vor dem LIVE passieren muss, damit der Stream Chance hat. Setup, Hook, erste 60 Sekunden, Kamerablick.",
    lessons: [
      {
        slug: "setup-vor-live",
        title: "Setup vor dem LIVE",
        summary: "Was in den 15 Minuten vor LIVE-Start passieren muss.",
        reading_minutes: 4,
        blocks: [
          { type: "lead", text: "Die 15 Minuten vor dem Stream entscheiden mehr als die ersten 30 Minuten LIVE." },
          { type: "h3", text: "Technik-Check" },
          { type: "ul", items: [
            "WLAN/Mobil stabil — Speedtest min 15 Mbps Upload",
            "Akku >70% oder am Strom",
            "Apps die Bandbreite ziehen geschlossen",
            "Mikrofon-Test: 1-2 Saetze in Test-Aufnahme, kurz anhoeren",
            "Licht: Hauptlicht von vorn, kein Gegenlicht aus dem Fenster",
            "Vertikal-Halter, nicht handheld",
          ] },
          { type: "h3", text: "Mental-Setup" },
          { type: "ul", items: [
            "Klare Aussage: warum gehe ich heute live?",
            "Hook-Satz fuer erste 30 Sekunden vorbereitet",
            "3 Themen die du bringen kannst",
            "1 konkrete CTA fuer die Zuschauer",
          ] },
          { type: "h3", text: "Stream-Titel" },
          { type: "p", text: "Kein 'kommt vorbei'. Konkrete Aussage. Beispiel: 'Match gegen Selin 21:00' oder 'Beauty-Routine — Fragen erwuenscht'. Spezifisch ziehen mehr Klicks als generisch." },
        ],
      },
      {
        slug: "erste-60-sekunden",
        title: "Erste 60 Sekunden",
        summary: "Wer in der ersten Minute joint, entscheidet ob TikTok dir mehr Zuschauer schickt.",
        reading_minutes: 5,
        blocks: [
          { type: "lead", text: "Der TikTok-Algorithmus testet deinen Stream in den ersten 60 Sekunden. Wenn fruehe Joiner sofort wieder gehen, drosselt TikTok deine Reichweite." },
          { type: "h2", text: "Was funktioniert" },
          { type: "ul", items: [
            "Direkt loslegen — keine 'Warte mal eben Mikro fixen'",
            "Begruessung in maximal 5 Sekunden, dann Inhalt",
            "Frage stellen die Antwort einlaedt",
            "Kamera-Blickkontakt mit dem ersten Zuschauer der schreibt",
            "Klare Info was die naechsten 30 Minuten passieren",
          ] },
          { type: "h2", text: "Was killt den Stream" },
          { type: "ul", items: [
            "Schweigen / lange Setup-Pausen am Anfang",
            "'Hi, hi, hi' an jeden einzelnen Zuschauer",
            "Lange Erklaerung warum heute spaet/anders/kurz",
            "Beschwerden ueber TikTok / Algorithmus",
            "Auf-die-Uhr-schauen wer alles drin ist",
          ] },
          { type: "callout", text: "Die ersten 60 Sekunden sind nicht fuer dich, sondern fuer den ersten neuen Zuschauer. Behandle ihn wie einen Gast, der 30 Sekunden im Tuerrahmen entscheidet ob er reinkommt." },
        ],
      },
    ],
  },

  {
    slug: "battles-matches",
    title: "Battles & Matches",
    intro:
      "Wann Match Sinn macht, wie du Partner findest, was im Battle entscheidet. Mit ZOE-Spezifika.",
    lessons: [
      {
        slug: "wann-matchen",
        title: "Wann macht Matchen Sinn",
        summary: "Match ist nicht immer richtig. Hier die Regeln wann ja, wann nein.",
        reading_minutes: 4,
        blocks: [
          { type: "h2", text: "Match macht Sinn wenn" },
          { type: "ul", items: [
            "Du gerade Reichweite brauchst — Partner zieht Reichweite mit",
            "Du Schwung verloren hast und Energie reinholen willst",
            "Es zur Stream-Story passt (z.B. Rivalitaet, Tag, Event)",
            "Der Partner aehnlich aktiv ist — beide muessen liefern",
          ] },
          { type: "h2", text: "Match killt deinen Stream wenn" },
          { type: "ul", items: [
            "Dein Stream gerade läuft + Community engaged ist",
            "Partner inaktiv ist oder schweigt",
            "Themen-Bruch: Beauty trifft Gaming ohne Brücke",
            "Sprache nicht passt (Deutsch trifft Englisch ohne Übersetzung)",
          ] },
          { type: "callout", text: "Faustregel: Match dann starten wenn dein eigener Stream zwischen 20% und 60% deiner Spitze laeuft. Drueber: zerstoerst Eigen-Run. Drunter: kein Hebel mehr fuer Partner." },
        ],
      },
      {
        slug: "battle-aufbau",
        title: "Battle — der saubere Aufbau",
        summary: "Battle ist mehr als 'wer mehr Diamanten kriegt'. So baust du Battles strategisch.",
        reading_minutes: 6,
        blocks: [
          { type: "h2", text: "5 Phasen eines Battles" },
          { type: "ol", items: [
            "Pre-Battle: Aufwaermen, Community vorwarnen, Erwartung setzen",
            "Battle-Start: erste 30 Sek nicht hektisch, klare Stimmung",
            "Mid-Battle: Story aufbauen, Lead-Wechsel kommunizieren",
            "Endphase: letzte 60 Sek — call-to-action an Community",
            "Post-Battle: Danke, Reaktion, naechster Schritt",
          ] },
          { type: "h2", text: "Was im Battle wirklich entscheidet" },
          { type: "ul", items: [
            "Wer mehr ENERGY rueberbringt — nicht wer mehr schreit",
            "Wer Community direkter anspricht (Namen nennen)",
            "Wer Drama/Stimmung erkennt und nutzt",
            "Wer auch bei Rueckstand ruhig bleibt",
          ] },
          { type: "callout", text: "Verlieren ist OK, wenn die Community sich danach connected fuehlt. Gewinnen ist wertlos, wenn Community sich verheizt fuehlt." },
        ],
      },
    ],
  },

  {
    slug: "watchtime",
    title: "Watchtime",
    intro:
      "Die wichtigste Metrik im LIVE. Wie du sie trackst, was sie killt, wie du sie hebst.",
    lessons: [
      {
        slug: "watchtime-grundprinzip",
        title: "Watchtime — Grundprinzip",
        summary:
          "Was Watchtime ist und warum sie ueber Reichweite entscheidet.",
        reading_minutes: 4,
        blocks: [
          { type: "lead", text: "Watchtime = wie lange der durchschnittliche Zuschauer in deinem Stream bleibt. Nicht Anzahl Zuschauer." },
          { type: "p", text: "TikTok bevorzugt Streams mit hoher Watchtime massiv. Wenn neue Joiner durchschnittlich 2 Minuten bleiben statt 20 Sekunden, schickt TikTok 5x mehr neue Joiner." },
          { type: "h2", text: "Watchtime hochziehen" },
          { type: "ul", items: [
            "Spannung aufbauen: 'Gleich kommt was', 'In 5 Min ist Match'",
            "Storyfetzen verteilen statt eine grosse Geschichte",
            "Fragen die Antworten brauchen — Zuschauer wartet auf Reaktion",
            "Nie sagen 'Ich beende gleich' — das kostet Zuschauer sofort",
          ] },
          { type: "h2", text: "Watchtime killt" },
          { type: "ul", items: [
            "Wiederholungen ('habe ich vorhin schon gesagt' Energy)",
            "Tote Phasen — wenn 30 Sekunden nichts passiert",
            "Diss / negativer Spam in den Kommentaren ohne Mod-Reaktion",
            "Zoom auf Telefon / Inventory / 'kurz weg'",
          ] },
        ],
      },
    ],
  },

  {
    slug: "community-aufbau",
    title: "Community Aufbau",
    intro:
      "Wie aus zufaelligen Zuschauern wiederkehrende Fans werden. Stamm-Community, Rituale, Wiedererkennung.",
    lessons: [
      {
        slug: "stamm-community",
        title: "Stamm-Community aufbauen",
        summary: "Die ersten 50 wiederkehrenden Zuschauer sind wichtiger als 5000 fluechtige.",
        reading_minutes: 5,
        blocks: [
          { type: "lead", text: "Die ersten 50 Stammgaeste sind dein Fundament. Wenn die da sind, traegt der Rest sich fast von selbst." },
          { type: "h2", text: "Wie du Stammgaeste erkennst" },
          { type: "ul", items: [
            "Joinen mehrfach pro Woche",
            "Schreiben in Kommentaren ohne Aufforderung",
            "Erinnern sich an Inhalte aus alten Streams",
            "Bringen andere mit",
          ] },
          { type: "h2", text: "Wie du sie haeltst" },
          { type: "ul", items: [
            "Beim Namen nennen — bei jedem Stream einmal",
            "Insider/Code-Phrasen einbauen die nur Stamm versteht",
            "Rituale: gleiche Begruessung, Stream-Eroeffnung, Abschluss",
            "Stammgaeste fragen ob/was sie als naechstes sehen wollen",
          ] },
          { type: "callout", text: "Stamm-Community erwartet dich. Wenn du eine Woche pause machst und nicht bescheid sagst, fuehlen sie sich vergessen. Bei laengeren Pausen: kurze Story oder Inbox-Notiz an die Top-Aktiven." },
        ],
      },
    ],
  },

  {
    slug: "wachstum",
    title: "Wachstum",
    intro:
      "Was wirklich Reichweite bringt. Posting-Frequenz, FYP-Logik, Cross-Promotion mit anderen Creator.",
    lessons: [
      {
        slug: "fyp-logik",
        title: "Wie der FYP-Algorithmus mit LIVE umgeht",
        summary:
          "Warum LIVE und Feed-Videos zusammen funktionieren — und warum LIVE-Only nicht waechst.",
        reading_minutes: 5,
        blocks: [
          { type: "lead", text: "Wer nur LIVE macht, waechst kaum. TikTok pusht LIVE staerker bei Accounts die parallel Feed-Content liefern." },
          { type: "h2", text: "3-2-1-Regel" },
          { type: "ul", items: [
            "3 Feed-Videos pro Woche — nicht weniger",
            "2 LIVE-Sessions pro Woche min",
            "1 Story pro Tag — niedrige Huerde, hoher Effekt auf Reichweite",
          ] },
          { type: "h2", text: "Was LIVE-Reichweite zusaetzlich pusht" },
          { type: "ul", items: [
            "Promo-Video 24h vor LIVE — Hook auf den LIVE-Termin",
            "Recap-Video 12h nach LIVE — beste Highlights",
            "Bio mit aktuellem LIVE-Plan",
            "Stream-Titel suchbar formulieren",
          ] },
        ],
      },
    ],
  },

  {
    slug: "technik",
    title: "Technik",
    intro:
      "Hardware-Setup, Audio, Licht, Fallback wenn das WLAN abkackt. Praktisch, kein Schnickschnack.",
    lessons: [
      {
        slug: "minimum-setup",
        title: "Minimum-Setup das funktioniert",
        summary: "Was du wirklich brauchst — und was Quatsch ist.",
        reading_minutes: 4,
        blocks: [
          { type: "h3", text: "Phone" },
          { type: "p", text: "Aktuelles Mid-Range-Smartphone reicht. Front-Cam Full-HD genuegt. Kein iPhone-Pro-Zwang." },
          { type: "h3", text: "Halterung" },
          { type: "p", text: "Vertikal, stabil, hoehenverstellbar. Phone auf Augenhoehe, NICHT von unten — von unten ist sofort ein 'amateur Look'." },
          { type: "h3", text: "Licht" },
          { type: "p", text: "Eine Ringleuchte vor dir reicht. Warmweiss (3500K), nicht kaltes Blau-Weiss. Niemals Gegenlicht aus dem Fenster." },
          { type: "h3", text: "Audio" },
          { type: "p", text: "Eingebautes Mikro reicht fuer ruhige Raeume. Bei Background-Lärm: günstiges Lavalier-Mic per Klinke/USB-C, ~20€." },
          { type: "h3", text: "Internet" },
          { type: "p", text: "WLAN bevorzugt. Mind. 15 Mbps Upload. Bei häufigen Aussetzern: 5G Mobile als Backup." },
          { type: "callout", text: "Was du NICHT brauchst: 4K-DSLR-Setup, Greenscreen, Profi-Mischpult. Das wird erst ab 1000+ stabilen Zuschauern relevant." },
        ],
      },
    ],
  },

  {
    slug: "shadowban-sicherheit",
    title: "Shadowban & Sicherheit",
    intro:
      "Account-Sicherheit, Recovery wenn was passiert, was du an Daten teilst und was nicht.",
    lessons: [
      {
        slug: "account-sicherheit",
        title: "Account-Sicherheit — Basics",
        summary:
          "2FA, sichere Email, Recovery — was du eingerichtet haben MUSST bevor du wachsen willst.",
        reading_minutes: 4,
        blocks: [
          { type: "lead", text: "Account-Hijacking ist real. Wer 5000+ Follower hat, ist Ziel. Diese Liste ist Pflicht." },
          { type: "ol", items: [
            "Email auf eigenes Konto, nicht Mail vom Ex / Familie",
            "2FA per Authenticator-App (Google Authenticator / Authy), NICHT SMS",
            "Backup-Codes ausgedruckt + sicher abgelegt",
            "Passwort einzigartig (Password-Manager: Bitwarden/1Password)",
            "Verbundene Apps regelmaessig pruefen — alles Unbekannte loeschen",
            "Login-Geraete-Liste pruefen, alle Fremd-Sessions abmelden",
          ] },
          { type: "callout", text: "Wenn du DM bekommst 'Du bist ausgewählt für TikTok-Programm, klicke hier' — IMMER Phishing. TikTok kontaktiert dich nicht so." },
        ],
      },
    ],
  },

  {
    slug: "tiktok-geschenke",
    title: "TikTok Geschenke",
    intro:
      "Welches Geschenk welchen Wert hat, wann was passt, wie du Stamm-Community zum Senden bewegst (ehrlich, nicht bettelnd).",
    lessons: [
      {
        slug: "geschenk-uebersicht",
        title: "Übersicht — wo steht was?",
        summary: "Komplette Gift-Liste mit Diamantenwerten — siehe Geschenke-Galerie.",
        reading_minutes: 2,
        blocks: [
          { type: "lead", text: "Die vollstaendige Geschenk-Galerie mit Diamantenwert + Coin-Preis findest du als eigene Sektion." },
          { type: "p", text: "Klick links auf 'TikTok Geschenke' — Gift-Galerie mit Bild, Name, Diamanten, Coins und Bedeutung im LIVE." },
          { type: "h3", text: "Was Diamonds eigentlich bedeuten" },
          { type: "p", text: "Diamonds sind die Currency die du ans Auszahlungs-Konto bekommst. 1 Diamond ≈ 0.005 USD je nach Region. Coins sind was Zuschauer zahlen — sie kosten Coins, du bekommst Diamonds. TikTok behaelt grob 50%." },
          { type: "callout", text: "Bitte niemals offen 'sendet mir XY-Geschenk' rufen. Das wirkt billig und triggert Algorithmus-Down. Stattdessen: Kontext schaffen und Geschenke entstehen lassen." },
        ],
      },
    ],
  },

  {
    slug: "agentur-standards",
    title: "Agentur Standards",
    intro:
      "Was ZOE von dir erwartet und was du von uns erwarten kannst. Verbindlich, klar, fair.",
    lessons: [
      {
        slug: "was-zoe-erwartet",
        title: "Was ZOE von dir erwartet",
        summary: "Verbindlichkeit, Kommunikation, Auftritt — kompakt.",
        reading_minutes: 4,
        blocks: [
          { type: "h3", text: "LIVE-Aktivitaet" },
          { type: "ul", items: [
            "Mind. 3 LIVE-Tage pro Woche",
            "Pro Tag mind. 60 Minuten echte Aktivitaet",
            "Wer pausiert: meldet das via 'LIVE-Abmeldung' im Portal",
          ] },
          { type: "h3", text: "Kommunikation" },
          { type: "ul", items: [
            "Antwortet auf Inbox-Nachrichten innerhalb 24-48h",
            "Telefon-Termin-Anfragen kommen ueber Portal — nicht ueber Privat-DM",
            "Krise/Sperre/Problem → 'Problem melden' Service oder direkt Management",
          ] },
          { type: "h3", text: "Auftritt" },
          { type: "ul", items: [
            "TikTok-Bio enthaelt: 'ZOE Star Agency Creator' (oder Variante)",
            "Kein Konflikt mit anderen Agencies parallel",
            "Showcase-Freigabe optional, aber empfohlen — siehe Profil",
          ] },
        ],
      },
      {
        slug: "was-zoe-bietet",
        title: "Was ZOE dir bietet",
        summary: "Dienstleistungen, Push, Match-Pool, persoenliches Management.",
        reading_minutes: 3,
        blocks: [
          { type: "ul", items: [
            "Persoenlicher Manager — feste Ansprechperson, kein Ticket-System",
            "TikTok Push: Wunschzeiten anmelden, wir verteilen Traffic",
            "Match-Pool: starke Match-Partner organisieren",
            "Content-Feedback ueber Content Helfer (kommt in Phase D)",
            "Account- und LIVE-Analyse direkt im Portal (kommt)",
            "Brand-Kooperationen: wenn dein Profil passt, wir kommen auf dich zu",
            "Academy: dieses Wissen, gepflegt + erweitert",
            "Inbox + Feed: kuenftig soziales Zentrum mit anderen ZOE-Creator",
          ] },
          { type: "callout", text: "Wir sind keine Massenagentur. Persoenliche Betreuung ist der Punkt. Wenn dein Manager nicht gut zu dir passt — sag es. Wir matchen anders." },
        ],
      },
    ],
  },
];

// ============================================================
//  TIKTOK GESCHENKE
// ============================================================

export const GIFTS: Gift[] = [
  { slug: "rose", name: "Rose", diamonds: 1, coins: 1, description: "Kleinste Geste, perfekt zum Begruessen.", use_case: "Hi-Geschenk, kostet fast nichts" },
  { slug: "tiktok", name: "TikTok-Logo", diamonds: 1, coins: 1, description: "Klassisches Mini-Gift.", use_case: "Begruessungsritual" },
  { slug: "finger-heart", name: "Finger Heart", diamonds: 5, coins: 5, description: "Suess, gerne in Gruppen geschickt.", use_case: "Stamm-Stammgast-Gift" },
  { slug: "ice-cream-cone", name: "Ice Cream Cone", diamonds: 1, coins: 1, description: "Beliebt in lockeren Streams.", use_case: "Casual" },
  { slug: "perfume", name: "Perfume", diamonds: 20, coins: 20, description: "Mittlere Geste, sichtbar im Stream.", use_case: "Lob, Reaktion auf gute Stelle" },
  { slug: "doughnut", name: "Doughnut", diamonds: 30, coins: 30, description: "Gut sichtbar, oft im Battle.", use_case: "Battle-Support" },
  { slug: "paper-crane", name: "Paper Crane", diamonds: 99, coins: 99, description: "Schoene Animation, nicht zu gross.", use_case: "Mittlere Anerkennung" },
  { slug: "rosa", name: "Rosa", diamonds: 100, coins: 100, description: "Wichtige Marke fuer 'mehr als nur kurz'.", use_case: "Stammgast-Loyalitaet" },
  { slug: "hand-heart", name: "Hand Heart", diamonds: 100, coins: 100, description: "Cleanere Variante zur Rosa.", use_case: "Romantischer Stream" },
  { slug: "corgi", name: "Corgi", diamonds: 299, coins: 299, description: "Beliebt im Gaming/Lifestyle.", use_case: "Persoenlicher Support" },
  { slug: "swan", name: "Swan", diamonds: 699, coins: 699, description: "Show-Geschenk mit grosser Animation.", use_case: "Special-Moment, Gewinn" },
  { slug: "rhythmic-rocking-horse", name: "Rocking Horse", diamonds: 1000, coins: 1000, description: "Erstes 4-stelliges Gift.", use_case: "Battle-Push, Highlight" },
  { slug: "sports-car", name: "Sports Car", diamonds: 7000, coins: 7000, description: "Premium-Geste.", use_case: "Schwerer Battle-Push" },
  { slug: "interstellar", name: "Interstellar", diamonds: 10000, coins: 10000, description: "Sehr sichtbarer Auftritt.", use_case: "Big-Match, VIP-Stamm" },
  { slug: "tiktok-universe", name: "TikTok Universe", diamonds: 44999, coins: 44999, description: "Top-tier Gift, sehr selten.", use_case: "Mega-Battle, viraler Moment" },
  { slug: "lion", name: "Lion", diamonds: 29999, coins: 29999, description: "Stark, mit Roar-Animation.", use_case: "Big-Match Climax" },
  { slug: "yacht", name: "Yacht", diamonds: 25000, coins: 25000, description: "Premium, bringt grosse Animation.", use_case: "Special Event, VIP" },
  { slug: "diamond-tree", name: "Diamond Tree", diamonds: 5000, coins: 5000, description: "Gerne zum Abschluss eines starken Streams.", use_case: "Stream-Klimax" },
];
