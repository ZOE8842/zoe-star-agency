// Volltextsuche ueber alle Academy-Lektionen.
//
// Vorher filterte die Suche nur die Kategorien und durchsuchte dabei bloss
// Titel und Kurzbeschreibung. Wer "Nebel" oder "Gift Baiting" eingab, bekam
// nichts, obwohl beides in Lektionen steht. Und getroffene Gruppen zeigten
// nicht, welche Lektion gemeint war.
//
// Jetzt wird der komplette Lektionstext durchsucht und es kommen einzelne
// Lektionen als Treffer zurueck, jede direkt verlinkbar.

import type { Category, Lesson } from "./types";
import type { LessonBlock } from "./blocks";

export interface SearchHit {
  categorySlug: string;
  categoryTitle: string;
  lesson: Lesson;
  /** Textstelle rund um den Treffer, fuer die Vorschau in der Ergebnisliste */
  excerpt: string;
}

/** Alle Textteile eines Blocks als ein String. */
function blockText(block: LessonBlock): string {
  switch (block.type) {
    case "ul":
    case "ol":
      return block.items.join(" ");
    case "kpi":
      return `${block.label} ${block.value}`;
    case "divider":
      return "";
    case "quote":
      return `${block.text} ${block.source ?? ""}`;
    default:
      return block.text;
  }
}

function lessonText(lesson: Lesson): string {
  return [
    lesson.title,
    lesson.summary,
    lesson.source_label ?? "",
    ...lesson.blocks.map(blockText),
  ].join(" ");
}

/** Ausschnitt um die erste Fundstelle, damit man sieht warum etwas passt. */
function makeExcerpt(text: string, needle: string): string {
  const at = text.toLowerCase().indexOf(needle);
  if (at < 0) return text.slice(0, 140).trim();
  const from = Math.max(0, at - 60);
  const to = Math.min(text.length, at + needle.length + 100);
  return (from > 0 ? "… " : "") + text.slice(from, to).trim() + (to < text.length ? " …" : "");
}

export function searchLessons(categories: Category[], query: string): SearchHit[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];

  const hits: SearchHit[] = [];
  for (const category of categories) {
    for (const lesson of category.lessons) {
      const text = lessonText(lesson);
      if (!text.toLowerCase().includes(needle)) continue;
      hits.push({
        categorySlug: category.slug,
        categoryTitle: category.title,
        lesson,
        excerpt: makeExcerpt(text, needle),
      });
    }
  }

  // Titel-Treffer zuerst, danach alphabetisch, damit die Reihenfolge stabil ist
  return hits.sort((a, b) => {
    const aTitle = a.lesson.title.toLowerCase().includes(needle) ? 0 : 1;
    const bTitle = b.lesson.title.toLowerCase().includes(needle) ? 0 : 1;
    if (aTitle !== bTitle) return aTitle - bTitle;
    return a.lesson.title.localeCompare(b.lesson.title, "de");
  });
}
