// Block-Renderer fuer Academy-Lessons.
// Block-basiert statt Markdown-Parser — kontrollierter, schneller,
// keine externe Dependency.

import type { ReactNode } from "react";

export type LessonBlock =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "lead"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "callout"; text: string }
  | { type: "quote"; text: string; source?: string }
  | { type: "kpi"; label: string; value: string }
  | { type: "divider" };

export function RenderBlocks({ blocks }: { blocks: LessonBlock[] }): ReactNode {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return (
              <h2
                key={i}
                className="font-display italic text-cream text-2xl md:text-3xl leading-tight tracking-[-0.01em] mt-10 mb-4"
              >
                {b.text}
              </h2>
            );
          case "h3":
            return (
              <h3
                key={i}
                className="text-cream text-lg md:text-xl font-medium mt-7 mb-3"
              >
                {b.text}
              </h3>
            );
          case "lead":
            return (
              <p key={i} className="text-cream/85 text-lg md:text-xl leading-relaxed mb-6">
                {b.text}
              </p>
            );
          case "p":
            return (
              <p key={i} className="text-cream/75 text-base md:text-lg leading-relaxed mb-4">
                {b.text}
              </p>
            );
          case "ul":
            return (
              <ul key={i} className="space-y-2 mb-6 text-cream/75">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-3 leading-relaxed">
                    <span className="text-champagne shrink-0">·</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="space-y-2 mb-6 text-cream/75 list-decimal pl-5">
                {b.items.map((it, j) => (
                  <li key={j} className="leading-relaxed pl-1">
                    {it}
                  </li>
                ))}
              </ol>
            );
          case "callout":
            return (
              <div
                key={i}
                className="border-l-2 border-champagne pl-4 py-1 my-6 text-cream/85 italic"
              >
                {b.text}
              </div>
            );
          case "quote":
            return (
              <blockquote key={i} className="my-6 text-cream/70">
                <p className="font-display italic text-xl md:text-2xl leading-snug mb-1">
                  „{b.text}"
                </p>
                {b.source && (
                  <p className="text-cream/45 text-xs uppercase tracking-[0.25em]">
                    {b.source}
                  </p>
                )}
              </blockquote>
            );
          case "kpi":
            return (
              <div
                key={i}
                className="inline-flex items-baseline gap-3 border border-champagne/20 px-4 py-2 mr-3 mb-3"
              >
                <span className="text-cream/55 text-[10px] uppercase tracking-[0.25em]">
                  {b.label}
                </span>
                <span className="font-display italic text-champagne text-lg">
                  {b.value}
                </span>
              </div>
            );
          case "divider":
            return <hr key={i} className="border-champagne/15 my-8" />;
        }
      })}
    </>
  );
}
