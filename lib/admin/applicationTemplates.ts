// Standard-Antwortvorlagen fuer creator_applications Triage.
// Tone: warm, premium, knapp - kein Smalltalk, kein KI-Klang.
// Platzhalter werden vom Caller ersetzt (siehe formatTemplate).

export interface TemplateContext {
  username: string;            // ohne @
  displayName?: string | null;
  language?: string | null;
}

export interface ApplicationTemplate {
  id: string;
  label: string;          // UI-Label
  channel: "tiktok" | "telegram" | "neutral";
  nextStatus: "contacted" | "rejected" | "reviewed";
  body: string;           // mit {{name}} {{username}} Platzhaltern
}

export const APPLICATION_TEMPLATES: ApplicationTemplate[] = [
  {
    id: "audit_call_invite",
    label: "Audit-Call vorschlagen",
    channel: "neutral",
    nextStatus: "contacted",
    body:
`Hi {{name}},

danke fuer deine Anfrage bei ZOE Star Agency. Dein Profil hat uns aufmerksam gemacht.

Wir wuerden gern einen kurzen Audit-Call (15-30 Min) mit dir machen, um deine Ziele zu verstehen und zu schauen ob wir matchen.

Wann passt es dir diese Woche? Wir sind flexibel zwischen 11-19 Uhr.

ZOE Star Agency`,
  },
  {
    id: "more_info_needed",
    label: "Mehr Infos anfordern",
    channel: "neutral",
    nextStatus: "reviewed",
    body:
`Hi {{name}},

danke fuer deine Anfrage. Damit wir dich richtig einordnen koennen, brauchen wir noch ein paar Infos:

- Wie viele LIVES machst du pro Woche?
- Wie sehen deine letzten Monatszahlen aus (Diamanten / Stunden)?
- Gibt es ein Format das du gern machen wuerdest?

Kurze Antwort reicht. Danach kommen wir mit konkretem Vorschlag zurueck.

ZOE Star Agency`,
  },
  {
    id: "polite_decline",
    label: "Hoeflich ablehnen",
    channel: "neutral",
    nextStatus: "rejected",
    body:
`Hi {{name}},

danke fuer deine Anfrage bei ZOE Star Agency. Wir haben dein Profil angeschaut.

Aktuell passt es bei uns nicht ins Portfolio. Das ist keine Wertung deiner Arbeit - wir nehmen sehr fokussiert auf.

Wir wuenschen dir viel Erfolg auf deinem Weg.

ZOE Star Agency`,
  },
];

export function formatTemplate(t: ApplicationTemplate, ctx: TemplateContext): string {
  const name = (ctx.displayName?.trim() || ctx.username || "").replace(/^@+/, "");
  return t.body
    .replace(/\{\{\s*name\s*\}\}/g, name)
    .replace(/\{\{\s*username\s*\}\}/g, ctx.username.replace(/^@+/, ""));
}
