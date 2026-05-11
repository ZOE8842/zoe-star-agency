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
  name_de: string;
  coins: number;
  category: "standard" | "team" | "exclusive";
  exclusive: boolean;
  required_level?: number;
  whale?: boolean;
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
        slug: "account-status-checken",
        title: "Account Status checken · die offizielle Quelle",
        summary:
          "Wo du in TikTok offiziell siehst ob dein Account in Ordnung ist — Schritt fuer Schritt.",
        reading_minutes: 4,
        blocks: [
          { type: "lead", text: "Wenn deine Reichweite ploetzlich stagniert, neue Zuschauer fehlen oder Streams tot wirken, ist die einzige verbindliche Quelle der 'Account Status' im TikTok Creator Center." },
          { type: "h2", text: "Wo du nachschaust" },
          { type: "ol", items: [
            "TikTok App oeffnen → Profil → Menue (drei Linien) → Tools",
            "'Account Status' antippen",
            "Hier listet TikTok offiziell:",
            "  · gemeldete Verstoesse",
            "  · aktive Einschraenkungen",
            "  · Dauer von Sperren",
          ] },
          { type: "h2", text: "Was offiziell dokumentiert ist" },
          { type: "ul", items: [
            "LIVE-Einschraenkungen — werden im Account Status angezeigt",
            "Community Guidelines Strikes — siehe TikTok Community Guidelines Center",
            "Account-Sperren — Appeal-Pfad im Creator Center",
          ] },
          { type: "h2", text: "Was du tun kannst" },
          { type: "ul", items: [
            "Eintrag im Account Status genau lesen — TikTok nennt den Grund",
            "Bei Strike: Appeal direkt aus dem Status-Eintrag heraus stellen",
            "Verstoss verstehen + im naechsten Stream / Post vermeiden",
            "Bei laufender LIVE-Einschraenkung: nicht versuchen das System zu umgehen — verlaengert nur die Dauer",
            "ZOE 'Problem melden' nutzen falls dir unklar ist was du falsch gemacht hast",
          ] },
          { type: "callout", text: "Goldene Regel: der Account Status im Creator Center ist die einzige verbindliche Quelle. Allgemeine 'Reichweitenprobleme' ohne Eintrag dort sind meist Zuschauer-/Watchtime-Themen, keine Strafe — und werden ueber besseren Content, nicht ueber Pause geloest." },
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
    slug: "account-sicherheit",
    title: "Account-Sicherheit & Reichweitenprobleme",
    intro:
      "Account-Sicherheit, Recovery wenn was passiert, plus: wo du im Creator Center offiziell siehst was los ist.",
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

  {
    slug: "live-psychologie",
    title: "LIVE Psychologie",
    intro:
      "Warum Zuschauer bleiben oder gehen — und wie du Energie, Spannung und Naehe gezielt aufbaust.",
    lessons: [
      {
        slug: "energie-und-naehe",
        title: "Energie + Naehe",
        summary: "Wie du als Person rueberkommen musst damit Stream-Bindung entsteht.",
        reading_minutes: 4,
        blocks: [
          { type: "p", text: "TikTok-LIVE wirkt erst dann, wenn die Zuschauer das Gefuehl haben, sie sind in einem Raum mit dir. Das ist keine Show — das ist Begegnung." },
          { type: "h3", text: "Die 3 Faktoren" },
          { type: "ul", items: [
            "Energie: Stimme, Tempo, Mimik — nicht erschoepft wirken, auch bei Mid-Stream",
            "Naehe: Namen lesen, direkte Reaktion, Augenkontakt zur Kamera",
            "Berechenbarkeit: Stamm-Rituale (Begruessung, Outro) damit Zuschauer wissen was kommt",
          ] },
          { type: "callout", text: "Niemand bleibt fuer einen perfekten Stream. Sie bleiben fuer einen Menschen den sie verstehen." },
        ],
      },
      {
        slug: "drop-points",
        title: "Drop-Points im LIVE",
        summary: "Die Momente in denen Zuschauer wegklicken — und wie du sie verhinderst.",
        reading_minutes: 3,
        blocks: [
          { type: "h3", text: "Klassische Drop-Points" },
          { type: "ul", items: [
            "Erste 5 Sekunden: kein Hook, kein klares Thema",
            "AFK-Phase ueber 30 Sekunden ohne Aktion",
            "Lange Pause nach Geschenk ohne Reaktion",
            "Match endet, Stream wirkt 'fertig'",
          ] },
          { type: "p", text: "Loesung: Aktiv ueberbruecken — 'Pause-Killer' wie 'Wer ist neu hier?' oder 'kurze Story bis das naechste passiert'." },
        ],
      },
    ],
  },

  {
    slug: "profil-optimierung",
    title: "Profil Optimierung",
    intro:
      "Dein TikTok-Profil ist deine Visitenkarte. Bio, Display-Name, Profilbild — was wirkt und was nicht.",
    lessons: [
      {
        slug: "bio-die-zieht",
        title: "Die Bio die zieht",
        summary: "Hook + Wer-bist-du + LIVE-Zeit in 3-4 Zeilen.",
        reading_minutes: 3,
        blocks: [
          { type: "h3", text: "Aufbau" },
          { type: "ul", items: [
            "Zeile 1: Wer bist du in 5 Woertern",
            "Zeile 2: Was machst du LIVE",
            "Zeile 3: Wann gehst du LIVE",
            "Zeile 4: Call-to-Action (folgen, Notification, kommen)",
          ] },
          { type: "callout", text: "Linktree weglassen. Klare Sprache statt Buzzwords. Drei Emoji-Anker reichen." },
        ],
      },
      {
        slug: "profilbild-strategie",
        title: "Profilbild-Strategie",
        summary: "Was in 32x32px noch erkennbar sein muss.",
        reading_minutes: 2,
        blocks: [
          { type: "ul", items: [
            "Gesicht klar im Frame, Augenhoehe",
            "Hintergrund einfarbig oder unscharf",
            "Helligkeit hoch genug fuer Mobile-Dark-Mode",
            "Branding-Element (Stern, Farbe) wiedererkennbar",
            "Kein Filter der das Gesicht verfremdet",
          ] },
        ],
      },
    ],
  },

  {
    slug: "analyse-verstehen",
    title: "Analyse verstehen",
    intro:
      "Klickrate, Watchtime, Geschenkerate — was die Zahlen wirklich bedeuten und was du daraus ableitest.",
    lessons: [
      {
        slug: "die-wichtigsten-kennzahlen",
        title: "Die wichtigsten Kennzahlen",
        summary: "Klickrate, Wiedergabezeit, Geschenkerate — Definition + Zielzahlen.",
        reading_minutes: 4,
        blocks: [
          { type: "h3", text: "Klickrate" },
          { type: "p", text: "Von 100 Zuschauern denen TikTok deinen Stream zeigt, wie viele klicken rein? Unter 15% = Cover/Titel zieht nicht. Ueber 25% solide." },
          { type: "h3", text: "Wiedergabezeit" },
          { type: "p", text: "Wie lange jemand im Schnitt bei dir bleibt. Unter 30 Sek = sofortiges Wegklicken. Ueber 1 Min gut, ueber 3 Min stark." },
          { type: "h3", text: "Geschenkerate" },
          { type: "p", text: "Von 100 Zuschauern wie viele schenken dir was? 1-2% ok, 3%+ gut, 5%+ stark." },
        ],
      },
      {
        slug: "was-du-machst-wenn",
        title: "Was du machst wenn …",
        summary: "Konkrete Hebel je nach Schwachstelle.",
        reading_minutes: 3,
        blocks: [
          { type: "ul", items: [
            "Klickrate niedrig -> Cover/Erste-3-Sekunden ueberarbeiten",
            "Wiedergabezeit niedrig -> Hook + erste 30 Sek planen",
            "Geschenkerate niedrig -> Geschenkgeber persoenlich begruessen, Reaktion zeigen",
            "Klickrate hoch, Wiedergabezeit niedrig -> Erwartung erfuellt sich nicht",
            "Wenige neue Follower -> CTA fehlt, kein Grund zu folgen",
          ] },
        ],
      },
    ],
  },
];

// ============================================================
//  TIKTOK GESCHENKE
// ============================================================

// Master-Liste (Stand 2026-05-11) · 143 Standard + 11 Team + 10 Exclusive.
// Whale-Gifts: speziell markiert fuer optische Hervorhebung im Frontend.
// Slugs werden deterministisch aus name_de generiert (Umlaut-safe).

const _slug = (n: string): string =>
  n
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[éèê]/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const _WHALES = new Set<string>([
  "Pegasus",
  "Feuerphönix",
  "Donnerfalke",
  "TikTok Stars",
  "TikTok Universe+",
  "Wächter-Nashorn",
  "Sam, der Wal",
  "Zeus",
]);

const _STANDARD: ReadonlyArray<readonly [string, number]> = [
  ["Fingerherz", 5],
  ["Flamingo-Schwimmtier", 999],
  ["3. Jahrestag", 12000],
  ["Partybus", 2999],
  ["Piratenschatz", 449],
  ["Stubenhocker", 500],
  ["Zeus", 34000],
  ["Leon und Lili", 9699],
  ["Du bist fantastisch", 500],
  ["Future Encounter", 1500],
  ["Surfender Pinguin", 499],
  ["Party On&On", 15000],
  ["Sende Positivität", 199],
  ["Alle zusammen", 500],
  ["Abendlichtfahrt", 10000],
  ["Prinz", 500],
  ["Herzgitarre", 500],
  ["TikTok-Shuttle", 20000],
  ["Geh aufs Ganze, Alpha Dr...", 7700],
  ["Jollies Land der Herzen", 2199],
  ["Gaming-Tastatur", 4000],
  ["Zitronenliebe", 2199],
  ["Ewige Rose", 399],
  ["Schlagzeug", 1000],
  ["Herztelefon", 299],
  ["City Pop", 450],
  ["Koffer", 199],
  ["Rockys Schlag", 2199],
  ["Cooper fliegt nach Hause", 1999],
  ["Superstar", 12000],
  ["Geldmagnet", 549],
  ["Saxophon", 9000],
  ["Schattengebundenen-Ab...", 1],
  ["Diamanten Geschenk", 1500],
  ["Achtung!", 1800],
  ["Goldene Boxhandschuhe", 10],
  ["Sam, der Wal", 30000],
  ["Discokugel", 1000],
  ["Eiswaffel", 1],
  ["Weltraumkatze", 1500],
  ["Taraxacum Corgi", 400],
  ["Community-Unterstützung", 15000],
  ["TikTok Stars", 39999],
  ["Debüt als Rennfahrer*in", 1500],
  ["Koralle", 499],
  ["Bussi", 1],
  ["Drache", 26999],
  ["Kaktus-Shuffle", 399],
  ["Lili, die Leopardin", 6599],
  ["Ritter-Abzeichen", 1],
  ["Auf dem Wasser treibend...", 1500],
  ["Bruderherz", 100],
  ["Pim Bär", 1500],
  ["Cabrio", 12000],
  ["Singender Bär", 399],
  ["Wächter-Nashorn", 30999],
  ["Grußkarte", 1500],
  ["Krasses Mikrofon", 1500],
  ["Kartoffel isst Spaghetti", 1500],
  ["Küss dein Herz", 99],
  ["Jollie, die Spaßbohne", 399],
  ["Mittleres Fandom", 900],
  ["Rosie, die Rosenbohne", 399],
  ["Pyramiden", 15000],
  ["Capybara", 30],
  ["Exklusiver Spark", 1099],
  ["Nächstes Level", 4099],
  ["Boxhandschuhe", 299],
  ["Parfüm", 20],
  ["Muschelenergie", 100],
  ["T-Rex", 25999],
  ["Strandtag", 2999],
  ["Familienzeit", 15000],
  ["Raumschiff", 13999],
  ["Auf Traumjagd", 1500],
  ["Tofu", 5],
  ["Sage, die smarte Bohne", 399],
  ["Spark", 20000],
  ["Verträumte Streichmusik", 249],
  ["TikTok", 1],
  ["Singendes Saxofon", 399],
  ["Freizeitpark", 17000],
  ["Rocky, die Rockbohne", 399],
  ["Regenschirm", 150],
  ["Zeichensprache der Liebe", 49],
  ["Sommerpass XL", 13500],
  ["Lupe", 10],
  ["Spielkonsole", 15000],
  ["S Blumen", 20],
  ["Adams Traumwelt", 25999],
  ["Unter Kontrolle", 1500],
  ["Papierkranich", 99],
  ["Flammenherz", 1],
  ["Magier-Abzeichen", 1],
  ["Mamma Mia", 1],
  ["Kartoffel mit Eiswaffel", 10],
  ["Slay", 1],
  ["You are on a Roll", 30],
  ["U make Miso happy!", 30],
  ["Wassereis", 10],
  ["Tom, die Tomate", 1],
  ["Teamherz", 1],
  ["Schokoladenkeks", 5],
  ["Cool", 1],
  ["Luftiges Herz", 1],
  ["Zwinkern", 1],
  ["Bravo!", 15],
  ["Sommersonne", 20],
  ["Freundschaftshalsband", 10],
  ["Liebesschweinchen", 10],
  ["Musik-Freund*in", 299],
  ["GG", 1],
  ["Tiny Diny", 10],
  ["Fruchtfreunde", 299],
  ["Regenbogen", 1],
  ["Bagel", 35],
  ["Dinosaurier-Fußabdruck", 1],
  ["You are my Jam", 30],
  ["DJ-Vinyl", 10],
  ["Pfeife", 10],
  ["Weiße Rose", 1],
  ["Pfirsich", 5],
  ["Zeitlupe", 10],
  ["Super", 1],
  ["Blitz", 1],
  ["Volle Pulle", 1],
  ["Lebkuchenherz", 1],
  ["Steven Wingman", 1],
  ["Überreagieren", 5],
  ["Freestyle", 1],
  ["Blauer Alien", 5],
  ["Morgenblüte", 1],
  ["Beschützerflügel", 1],
  ["Namentliche Anerkennung", 5],
  ["Alien Haustier", 1],
  ["Daumen hoch", 2],
  ["Goldener Spieler", 5],
  ["Hallo Reisender", 5],
  ["Pop", 1],
  ["Basketball", 1],
  ["Tortenstück", 1],
  ["Reise-Pass", 10],
  ["Oldies", 1],
];

const _TEAM: ReadonlyArray<readonly [string, number]> = [
  ["Beliebt werden", 1],
  ["Super beliebt", 9],
  ["Funken zum Erreichen...", 99],
  ["Grüßendes Herz", 99],
  ["Erblühendes Herz", 299],
  ["Blühendes Herz", 1599],
  ["Hingebungsvolles Herz", 5999],
  ["Kristallherz", 14999],
  ["Fliegende Liebe", 19999],
  ["Unendliches Herz", 23999],
  ["Angesagte Person", 999],
];

// [name_de, coins, required_level?] · undefined = unbekanntes Level
const _EXCLUSIVE: ReadonlyArray<readonly [string, number, number | undefined]> = [
  ["Fabelhaftes Konfetti", 100, 10],
  ["Juwelenpistole", 500, 15],
  ["Leuchtender Heißluftballon", 1000, 20],
  ["Privatjet", 4888, 25],
  ["Premium-Shuttle", 20000, 30],
  ["TikTok Universe+", 34999, 40],
  ["Donnerfalke", 39999, 43],
  ["Feuerphönix", 41999, 46],
  ["Pegasus", 42999, 50],
  ["Level-Raumschiff", 21000, undefined],
];

export const GIFTS: Gift[] = [
  ..._STANDARD.map(([name_de, coins]) => {
    const g: Gift = {
      slug: _slug(name_de),
      name_de,
      coins,
      category: "standard",
      exclusive: false,
    };
    if (_WHALES.has(name_de)) g.whale = true;
    return g;
  }),
  ..._TEAM.map(([name_de, coins]) => {
    const g: Gift = {
      slug: _slug(name_de),
      name_de,
      coins,
      category: "team",
      exclusive: false,
    };
    if (_WHALES.has(name_de)) g.whale = true;
    return g;
  }),
  ..._EXCLUSIVE.map(([name_de, coins, required_level]) => {
    const g: Gift = {
      slug: _slug(name_de),
      name_de,
      coins,
      category: "exclusive",
      exclusive: true,
    };
    if (required_level !== undefined) g.required_level = required_level;
    if (_WHALES.has(name_de)) g.whale = true;
    return g;
  }),
];
