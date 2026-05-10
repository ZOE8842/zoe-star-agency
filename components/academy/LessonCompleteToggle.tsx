"use client";

import { useState, useTransition } from "react";
import { toggleLessonComplete } from "@/app/portal/academy/actions";

interface Props {
  categorySlug: string;
  lessonSlug: string;
  initialCompleted: boolean;
}

export function LessonCompleteToggle({ categorySlug, lessonSlug, initialCompleted }: Props) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [isPending, startTransition] = useTransition();

  const click = () => {
    setCompleted((v) => !v); // optimistic
    startTransition(async () => {
      const r = await toggleLessonComplete(categorySlug, lessonSlug);
      if (r.ok) setCompleted(r.completed);
    });
  };

  return (
    <button
      type="button"
      onClick={click}
      disabled={isPending}
      className={`inline-flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-[0.25em] transition-colors ${
        completed
          ? "bg-champagne text-ink hover:bg-champagne-300"
          : "border border-champagne/30 text-cream/75 hover:border-champagne hover:text-cream"
      }`}
    >
      <span>{completed ? "✓ Gelesen" : "Als gelesen markieren"}</span>
    </button>
  );
}
