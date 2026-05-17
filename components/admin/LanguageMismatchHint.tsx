// Render-side Hinweis fuer Admin: zeigt Warnung wenn profile.language
// nicht zur erkannten Schreibsprache (Bio) passt. Heuristik-basiert,
// nur Hinweis - keine automatische Aenderung.

import { analyzeText } from "@/lib/i18n/language-mismatch";

interface Props {
  language: string | null;
  bio: string | null;
}

export function LanguageMismatchHint({ language, bio }: Props) {
  const result = analyzeText(bio, language ?? "de");
  if (!result.isMismatch) return null;

  return (
    <div className="border border-amber-400/40 bg-amber-400/[0.05] px-4 py-3 mt-3 text-xs">
      <p className="text-amber-300 font-medium mb-1">
        ⚠ Sprach-Hinweis · evtl. falsch zugeordnet
      </p>
      <p className="text-cream/60">
        Portal-Sprache ist <strong>{(language ?? "de").toUpperCase()}</strong>,
        aber das Bio enthaelt {result.deScore} deutsche Stopwoerter.
        Bitte verifizieren ob die Sprache passt.
      </p>
    </div>
  );
}
