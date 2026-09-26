// Monatliche Mindestwerte fuer Creator — eine Quelle fuer alles.
//
// Diese Zahlen stehen seit 25.09.2026 oeffentlich auf /join und in der FAQ.
// Wer sie hier aendert, aendert sie auch dort: beide Seiten lesen aus dieser
// Datei. Sonst verspricht die Webseite etwas anderes, als das Portal misst.

export interface Monatsziel {
  /** Technischer Schluessel */
  key: "live_tage" | "live_stunden" | "portal_tage";
  /** Wie es im Portal und auf der Webseite heisst */
  label: string;
  /** Zu erreichender Wert im Kalendermonat */
  ziel: number;
  /** Einheit fuer die Anzeige, z. B. "Tage" */
  einheit: string;
  /** Erklaerung in einem Satz */
  beschreibung: string;
}

export const MONATSZIELE: Monatsziel[] = [
  {
    key: "live_tage",
    label: "Gültige LIVE-Tage",
    ziel: 8,
    einheit: "Tage",
    beschreibung:
      "Tage im Monat, die TikTok als gültigen LIVE-Tag zählt.",
  },
  {
    key: "live_stunden",
    label: "LIVE-Stunden",
    ziel: 20,
    einheit: "Std",
    beschreibung:
      "Sendezeit im Monat, frei über deine Tage verteilbar.",
  },
  {
    key: "portal_tage",
    label: "Tage im Portal",
    ziel: 8,
    einheit: "Tage",
    beschreibung:
      "Tage, an denen du im Portal warst — Slots, Inbox, deine Zahlen.",
  },
];

/** Schneller Zugriff auf einen einzelnen Zielwert. */
export function zielWert(key: Monatsziel["key"]): number {
  return MONATSZIELE.find((z) => z.key === key)?.ziel ?? 0;
}

/**
 * Wie viele Tage der laufende Monat noch hat, den heutigen mitgezaehlt.
 * Basis fuer die Einschaetzung, ob ein offener Wert noch erreichbar ist.
 */
export function resttageImMonat(jetzt = new Date()): number {
  const letzter = new Date(jetzt.getFullYear(), jetzt.getMonth() + 1, 0).getDate();
  return letzter - jetzt.getDate() + 1;
}

export type Ampel = "erreicht" | "auf_kurs" | "knapp" | "offen";

/**
 * Bewertet einen Stand gegen sein Ziel.
 *
 * "auf_kurs"  — im verbleibenden Monat gut zu schaffen
 * "knapp"     — nur noch erreichbar, wenn ab jetzt fast taeglich gesendet wird
 * "offen"     — rechnerisch in den Resttagen nicht mehr zu schaffen
 *
 * Bei Stunden rechnen wir mit hoechstens 6 Stunden Sendezeit pro Tag; mehr
 * ist die Ausnahme und taugt nicht als Grundlage fuer eine Zusage.
 */
export function bewerte(
  key: Monatsziel["key"],
  stand: number,
  jetzt = new Date(),
): Ampel {
  const ziel = zielWert(key);
  if (stand >= ziel) return "erreicht";

  const rest = resttageImMonat(jetzt);
  const fehlt = ziel - stand;
  const proTagMoeglich = key === "live_stunden" ? 6 : 1;
  const maxNochMoeglich = rest * proTagMoeglich;

  if (maxNochMoeglich < fehlt) return "offen";
  // Wer mehr als die Haelfte der Resttage braucht, wird es eng haben.
  if (fehlt / proTagMoeglich > rest * 0.5) return "knapp";
  return "auf_kurs";
}
