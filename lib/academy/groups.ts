// Themengruppen der Academy.
//
// Vorher gab es 13 Kategorien, viele davon mit ein oder zwei Lektionen. Das
// war auf der Uebersicht unuebersichtlich. Jetzt gibt es sieben Gruppen, in
// denen die Lektionen thematisch zusammenstehen.
//
// Eine Gruppe listet nur Lektions-Slugs. Die Inhalte selbst bleiben in
// data.ts und data-extra.ts. Wer eine Lektion verschieben will, aendert nur
// die Reihenfolge hier. Neue Lektion: Inhalt in data-extra.ts anlegen und den
// Slug in die passende Gruppe eintragen.
//
// Die Reihenfolge in `lessons` ist auch die Lesereihenfolge im Portal.

export interface LessonGroup {
  slug: string;
  title: string;
  intro: string;
  lessons: string[];
}

export const GROUPS: LessonGroup[] = [
  {
    slug: "start",
    title: "Start bei ZOE",
    intro:
      "Die ersten Tage: was wir voneinander erwarten, welche Mindestwerte gelten und wie dein Profil aussehen sollte, bevor du loslegst.",
    lessons: [
      "start-bei-zoe",
      "was-zoe-erwartet",
      "was-zoe-bietet",
      "mindestanforderungen",
      "profil-als-visitenkarte",
    ],
  },
  {
    slug: "regeln-sicherheit",
    title: "Regeln & Account-Sicherheit",
    intro:
      "Was dich sperren kann und was du tust, wenn es passiert ist. Community Guidelines, LIVE-Regeln, Gift Baiting und der richtige Weg beim Widerspruch.",
    lessons: [
      "community-guidelines-kompakt",
      "live-spezifische-regeln",
      "gift-baiting-vermeiden",
      "rauchen-alkohol-und-18plus",
      "account-sicherheit",
      "account-status-checken",
      "sperren-und-widerspruch",
    ],
  },
  {
    slug: "dein-live",
    title: "Dein LIVE",
    intro:
      "Vom Setup bis zum Ablauf: Technik, Auftreten, die ersten Minuten, Dauer und was zu welcher Tageszeit funktioniert.",
    lessons: [
      "minimum-setup",
      "ausstattung-schritt-fuer-schritt",
      "setup-vor-live",
      "auftreten-im-stream",
      "erste-60-sekunden",
      "erste-15-minuten",
      "live-dauer-und-neustart",
      "tagesstruktur-im-stream",
      "energie-und-naehe",
      "drop-points",
    ],
  },
  {
    slug: "community",
    title: "Community & Supporter",
    intro:
      "Wie aus Zuschauern Stammleute werden, wie du Supporter bindest, ohne von ihnen abhaengig zu sein, und welche Kanaele dir dabei helfen.",
    lessons: [
      "stamm-community",
      "begruessungsnachricht",
      "supporter-binden",
      "unabhaengig-von-supportern-bleiben",
      "schwarzes-brett-und-gruppen",
      "konstanz-schlaegt-talent",
    ],
  },
  {
    slug: "reichweite",
    title: "Sichtbarkeit & Reichweite",
    intro:
      "Wie du gefunden wirst: Algorithmus, LIVE-Zeiten, Videos und Storys, Events, der Platinum Push und die Arbeit zwischen den Streams.",
    lessons: [
      "fyp-logik",
      "live-zeiten-finden",
      "videos-und-storys",
      "arbeit-ausserhalb-des-lives",
      "bio-die-zieht",
      "profilbild-strategie",
      "events-nutzen",
      "platinum-push",
      "wochenende-und-monatswechsel",
    ],
  },
  {
    slug: "watchtime-zahlen",
    title: "Watchtime & Zahlen",
    intro:
      "Die Werte, die ueber deine Ausspielung entscheiden, und was du nach dem LIVE daraus ableitest.",
    lessons: [
      "watchtime-grundprinzip",
      "watchtime-hebel-im-alltag",
      "blockieren-kostet-reichweite",
      "die-wichtigsten-kennzahlen",
      "nach-dem-live-auswerten",
      "was-du-machst-wenn",
    ],
  },
  {
    slug: "matches-geschenke",
    title: "Matches, Geschenke & Auszahlung",
    intro:
      "Match-Taktik im Detail, die Geschenk-Funktionen von TikTok und wie sich deine Auszahlung wirklich berechnet.",
    lessons: [
      "wann-matchen",
      "battle-aufbau",
      "match-gameplay-5-minuten",
      "matchpartner-waehlen",
      "geschenk-uebersicht",
      "geschenkegalerie-und-duell",
      "community-geschenk",
      "coins-guenstiger-aufladen",
      "auszahlungssystem-missionen",
    ],
  },
];

// ------------------------------------------------------------------
// Alte Kategorie-Slugs
//
// Bis zum Umbau auf Themengruppen liefen die URLs ueber 13 Kategorien.
// Wer einen alten Link offen hat, im Verlauf findet oder gespeichert hat,
// wuerde sonst auf einer 404-Seite landen. Deshalb bleibt die Zuordnung
// hier stehen und die Seiten leiten still weiter.
export const LEGACY_CATEGORY_SLUGS: Record<string, string> = {
  "tiktok-regeln": "regeln-sicherheit",
  "account-sicherheit": "regeln-sicherheit",
  "live-grundlagen": "dein-live",
  technik: "dein-live",
  "live-psychologie": "dein-live",
  watchtime: "watchtime-zahlen",
  "analyse-verstehen": "watchtime-zahlen",
  "community-aufbau": "community",
  wachstum: "reichweite",
  "profil-optimierung": "reichweite",
  "agentur-standards": "start",
  "tiktok-geschenke": "matches-geschenke",
  "battles-matches": "matches-geschenke",
};

/** Gruppe, in der eine Lektion aktuell steht. null, wenn es sie nicht gibt. */
export function groupSlugForLesson(lessonSlug: string): string | null {
  const group = GROUPS.find((g) => g.lessons.includes(lessonSlug));
  return group?.slug ?? null;
}

/**
 * Zielgruppe fuer einen angefragten Kategorie-Slug.
 * Gibt den Slug unveraendert zurueck, wenn es die Gruppe gibt, sonst den
 * Nachfolger aus der Legacy-Tabelle, sonst null.
 */
export function resolveGroupSlug(requested: string): string | null {
  if (GROUPS.some((g) => g.slug === requested)) return requested;
  return LEGACY_CATEGORY_SLUGS[requested] ?? null;
}
