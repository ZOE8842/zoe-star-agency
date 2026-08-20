// Academy V2.1 · Insider-Cards
// Schnelle Mini-Karten mit harter Agency-Wahrheit.
// Keine langen Texte. Direkt. Praktisch. TikTok-native.

export type InsiderTone = "killer" | "warn" | "topmove" | "tip";

export interface InsiderCard {
  tone: InsiderTone;
  title: string;
  body: string;
  why?: string;
}

const TONE_LABEL: Record<InsiderTone, string> = {
  killer: "Algo-Killer",
  warn: "Mach das nicht",
  topmove: "Top-Streamer machen das",
  tip: "Quick-Tip",
};

const TONE_STYLE: Record<InsiderTone, string> = {
  killer: "border-red-400/40 bg-red-400/5",
  warn: "border-red-400/40 bg-red-400/5",
  topmove: "border-champagne bg-champagne/5",
  tip: "border-champagne/30 bg-transparent",
};

const TONE_LABEL_STYLE: Record<InsiderTone, string> = {
  killer: "bg-red-400/15 text-red-300/90",
  warn: "bg-red-400/15 text-red-300/90",
  topmove: "bg-champagne text-ink",
  tip: "bg-champagne/15 text-champagne",
};

export const INSIDER_CARDS: InsiderCard[] = [
  // ── ALGO-KILLER ─────────────────────────────────────────────────
  {
    tone: "killer",
    title: "Stille in den ersten 60 Sekunden",
    body: "Algo entscheidet in Min. 1 wer noch Reach kriegt. Wer da still ist, kriegt nichts mehr.",
    why: "Beobachtung aus Agency-Praxis · von TikTok nicht offiziell dokumentiert",
  },
  {
    tone: "killer",
    title: "Neu starten, sobald es ruhig wird",
    body: "Jeder Restart setzt deine aufgebaute Watchtime auf null. Fruehestens nach 70 Minuten neu starten, vorher kostet es mehr als es bringt.",
    why: "Watchtime zaehlt nur innerhalb eines durchgehenden Streams",
  },
  {
    tone: "tip",
    title: "Wann ein Neustart wirklich hilft",
    body: "Nach 70 bis 90 Minuten, wenn die Zuschauerzahl trotz Aktivitaet flach bleibt. Vorher ankuendigen, Story posten, dann sauber neu starten.",
    why: "Der Algorithmus bewertet den neuen Stream frisch, aber nur wenn der alte lang genug lief",
  },
  {
    tone: "killer",
    title: "Match in Minute 1-5",
    body: "Du gewinnst Match-Volumen, verlierst aber Zuschauer die noch nicht angekommen sind. 10-15 Min warm-up zuerst.",
    why: "Erst Stream stabilisieren, dann Battle",
  },
  {
    tone: "killer",
    title: "Stille Zuschauer einfach laufen lassen",
    body: "Zwanzig Leute, die nur zuschauen, ziehen deine Werte staerker runter als fuenf aktive sie heben. Sprich eine Person direkt an, statt zwanzig zu ignorieren.",
    why: "TikTok misst Interaktion, nicht Kopfzahl",
  },

  // ── MACH DAS NICHT ─────────────────────────────────────────────
  {
    tone: "warn",
    title: "Gegenleistung fuer Geschenk versprechen",
    body: "'Bei 100 Roses ziehe ich aus' = Sofort-Sperre. Auch dezenter formulierter Trade ist Gift-Baiting.",
    why: "Gift-Baiting = harter Verstoss",
  },
  {
    tone: "warn",
    title: "Alkohol-Flasche oder Zigaretten im Bild",
    body: "Reicht im Hintergrund. Selbst wenn du nichts trinkst. Reach-Drosselung sofort.",
    why: "Auch passive Sichtbarkeit triggert Strikes",
  },
  {
    tone: "warn",
    title: "Bei Sperre auf anderen Account ausweichen",
    body: "TikTok erkennt Geraet + IP. Beide Accounts gehen drauf. Einziger Weg: 24h Pause + sauberer Appeal.",
    why: "Multi-Account-Workaround = doppelter Ban",
  },
  {
    tone: "warn",
    title: "Toxische Zuschauer sofort blockieren",
    body: "Lieber muten + dranbleiben. Block schickt Signal an Algo. Mute haelt deine Watchtime stabil.",
    why: "Block = Algo-Negativ-Signal",
  },
  {
    tone: "warn",
    title: "Immer gleicher Matchpartner",
    body: "Zuschauer kennen den Ablauf, Spannung weg, Algo merkt geringere Watchtime. Variation = Pflicht.",
    why: "Spannung haelt Reach",
  },

  // ── TOP-STREAMER MACHEN DAS ────────────────────────────────────
  {
    tone: "topmove",
    title: "Setup VOR Stream-Start fertig",
    body: "Top-Streamer fummeln nie waehrend Min. 1 am Licht. Alles getestet, dann GO.",
  },
  {
    tone: "topmove",
    title: "Stamm-Zuschauer namentlich begruessen",
    body: "Nicht nur die Geschenkgeber. Auch die stillen Lurker, wenn du sie wiedererkennst. Bindung wird unbezahlbar.",
  },
  {
    tone: "topmove",
    title: "Lang am Stueck statt Stop+Restart",
    body: "Offiziell: ab 25 Min real-time zaehlt der LIVE-Tag fuer Boni. Erfahrungswert: durchgaengige 60-90 Min performen meist besser als mehrere kurze Streams — TikTok bestaetigt das nicht offiziell.",
  },
  {
    tone: "topmove",
    title: "Wochenmissionen abhaken bevor Bonus-Zeit lockt",
    body: "Konstanz schlaegt Volumen. 5 stabile Tage > 2 Mega-Streams.",
  },
  {
    tone: "topmove",
    title: "Pause-Killer in der Tasche",
    body: "Wenn Match endet oder Geschenk ausbleibt: 1-2 Mini-Themen vorbereitet ('Wer ist neu?' / kurze Story / Community-Frage).",
  },

  // ── QUICK-TIPS ─────────────────────────────────────────────────
  {
    tone: "tip",
    title: "Prime-Time pruefen, nicht annehmen",
    body: "18-23 Uhr Berlin ist Standard. Deine Audience kann anders ticken — teste 12-14 Uhr und 22-00 Uhr.",
  },
  {
    tone: "tip",
    title: "Mods VORHER briefen",
    body: "Spam-Worte, Banned-Topics, was begruesst werden soll. Im LIVE kein Crash-Kurs mehr.",
  },
  {
    tone: "tip",
    title: "Hochformat 3:4 fuer Profilbild",
    body: "Erkennbar in 32x32 px. Gesicht auf Augenhoehe, klarer Hintergrund, Branding-Element.",
  },
  {
    tone: "tip",
    title: "Stories als LIVE-Ankuendigung",
    body: "Erfahrungswert: 30 Min vor LIVE-Start eine Story posten hebt die Start-Klickrate spuerbar. Keine offizielle TikTok-Zahl.",
  },
];

export function cardsByTone(tone: InsiderTone): InsiderCard[] {
  return INSIDER_CARDS.filter((c) => c.tone === tone);
}

export const INSIDER_TONE_LABEL = TONE_LABEL;
export const INSIDER_TONE_STYLE = TONE_STYLE;
export const INSIDER_TONE_LABEL_STYLE = TONE_LABEL_STYLE;
