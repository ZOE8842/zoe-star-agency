// Sehr leichte Heuristik: zaehlt deutsche Stopwoerter in einem Text.
// Wenn ein Creator mit profile.language != 'de' viele deutsche Stopwoerter
// in seinem Bio/Display-Name hat, ist die Portal-Sprache evtl. falsch
// gesetzt → Admin-Hinweis zur Verifikation.
//
// NICHT automatisch aendern - nur Hinweis. Heuristik ist absichtlich
// konservativ (keine fancy Sprach-Detection-Lib, kein KI-Call).

const DE_STOPWORDS = new Set([
  "ich","und","der","die","das","ist","mit","fuer","für","nicht","aber",
  "schon","auch","wenn","sein","wir","sie","mir","mich","mein","meine",
  "vom","zum","beim","durch","gegen","ohne","sondern","jetzt","sehr",
  "hier","dort","heute","morgen","gestern","immer","nie","wo","was","wie",
  "warum","wann","danke","bitte","liebe","hallo","gruss","grüsse","von",
  "auf","an","in","im","am","den","dem","des",
]);

const NON_DE_LATIN_HINTS = [
  // Französisch typische
  ["fr", /\b(je|tu|nous|vous|bonjour|merci|c['']est|très|être|avoir|fait|tout|donc)\b/i],
  // Portugiesisch typische
  ["pt", /\b(eu|você|nós|obrigad[ao]|muito|também|fazer|ser|estar|tudo|então)\b/i],
  // Tuerkisch typische
  ["tr", /\b(ben|sen|biz|teşekkür|merhaba|çok|var|yok|nasıl|ne|kim|hangi)\b/i],
  // Englisch typische (vereinfacht)
  ["en", /\b(the|and|is|of|to|in|with|for|you|that|this|have|are)\b/i],
] as const;

export interface MismatchResult {
  /** True wenn profile.language gesetzt ist, aber Text wirkt deutsch */
  isMismatch: boolean;
  /** Anzahl deutscher Stopwoerter im Text */
  deScore: number;
  /** Erkannte Konkurrenz-Sprache, wenn vorhanden */
  detectedNonDe: string | null;
}

export function analyzeText(text: string | null | undefined, profileLang: string): MismatchResult {
  if (!text || profileLang === "de") {
    return { isMismatch: false, deScore: 0, detectedNonDe: null };
  }
  const clean = text.toLowerCase().replace(/[^a-zäöüß\sçéèêàâîïôûœãõ']/gi, " ");
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length < 5) {
    return { isMismatch: false, deScore: 0, detectedNonDe: null };
  }
  let deScore = 0;
  for (const w of words) {
    if (DE_STOPWORDS.has(w)) deScore++;
  }

  // Konkurrenz-Sprache-Match (falls Profil != de und Text liegt eindeutig in
  // einer anderen Sprache, KEIN Mismatch melden — Profil ist ok).
  let detectedNonDe: string | null = null;
  for (const [lang, re] of NON_DE_LATIN_HINTS) {
    if (lang === profileLang) continue;
    if (re.test(text)) { detectedNonDe = lang; break; }
  }

  // Heuristik: Profil != de UND >=3 deutsche Stopwoerter UND Text >=5 Woerter
  // UND keine andere klar passende Sprache → mismatch.
  // Wenn aber Profil-Sprache selbst im Text vorkommt, kein Mismatch.
  const profileLangRe = NON_DE_LATIN_HINTS.find(([l]) => l === profileLang)?.[1];
  const profileLangMatches = profileLangRe ? profileLangRe.test(text) : false;

  const isMismatch = deScore >= 3 && !profileLangMatches;
  return { isMismatch, deScore, detectedNonDe };
}
