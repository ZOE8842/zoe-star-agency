"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/academy/data";
import { QUIZZES } from "@/lib/academy/quizzes";

function lessonExists(categorySlug: string, lessonSlug: string): boolean {
  const cat = CATEGORIES.find((c) => c.slug === categorySlug);
  if (!cat) return false;
  return !!cat.lessons.find((l) => l.slug === lessonSlug);
}

export async function toggleLessonComplete(
  categorySlug: string,
  lessonSlug: string,
): Promise<{ ok: boolean; completed: boolean; error?: string }> {
  if (!lessonExists(categorySlug, lessonSlug)) {
    return { ok: false, completed: false, error: "Lesson nicht gefunden." };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, completed: false, error: "Nicht eingeloggt." };

  const { data: existing } = await supabase
    .from("academy_progress")
    .select("id")
    .eq("profile_id", user.id)
    .eq("category_slug", categorySlug)
    .eq("lesson_slug", lessonSlug)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("academy_progress")
      .delete()
      .eq("id", existing.id);
    if (error) return { ok: false, completed: false, error: error.message };
    revalidatePath("/portal/academy");
    revalidatePath(`/portal/academy/${categorySlug}`);
    revalidatePath(`/portal/academy/${categorySlug}/${lessonSlug}`);
    return { ok: true, completed: false };
  }

  const { error } = await supabase
    .from("academy_progress")
    .insert({ profile_id: user.id, category_slug: categorySlug, lesson_slug: lessonSlug });
  if (error) return { ok: false, completed: false, error: error.message };
  revalidatePath("/portal/academy");
  revalidatePath(`/portal/academy/${categorySlug}`);
  revalidatePath(`/portal/academy/${categorySlug}/${lessonSlug}`);
  return { ok: true, completed: true };
}

interface QuizSubmission {
  quizSlug: string;
  answers: Record<string, number>; // questionIdx -> answerIdx
}

export async function submitQuizAttempt(input: QuizSubmission): Promise<{
  ok: boolean;
  score?: number;
  max_score?: number;
  correct_answers?: Record<string, number>;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht eingeloggt." };

  const quiz = QUIZZES.find((q) => q.slug === input.quizSlug);
  if (!quiz) return { ok: false, error: "Quiz nicht gefunden." };

  let score = 0;
  const correct_answers: Record<string, number> = {};
  for (let i = 0; i < quiz.questions.length; i++) {
    correct_answers[String(i)] = quiz.questions[i].correct;
    if (input.answers[String(i)] === quiz.questions[i].correct) score++;
  }

  const { error } = await supabase.from("academy_quiz_attempts").insert({
    profile_id: user.id,
    quiz_slug: input.quizSlug,
    score,
    max_score: quiz.questions.length,
    answers: input.answers,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/academy");
  revalidatePath("/portal/academy/quiz");
  revalidatePath(`/portal/academy/quiz/${input.quizSlug}`);
  return { ok: true, score, max_score: quiz.questions.length, correct_answers };
}
