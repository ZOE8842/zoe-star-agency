// Typen der Academy-Inhalte. Liegen separat, damit data.ts und
// data-extra.ts beide darauf zugreifen koennen, ohne sich gegenseitig
// zu importieren.

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
