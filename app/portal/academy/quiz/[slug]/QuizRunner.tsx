"use client";

import { useState } from "react";
import Link from "next/link";
import { submitQuizAttempt } from "@/app/portal/academy/actions";
import type { Quiz } from "@/lib/academy/quizzes";

export function QuizRunner({ quiz }: { quiz: Quiz }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    max_score: number;
    correct_answers: Record<string, number>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLast = step === quiz.questions.length - 1;
  const currentQ = quiz.questions[step];
  const currentAnswered = answers[String(step)] !== undefined;

  const pick = (idx: number) => {
    setAnswers((a) => ({ ...a, [String(step)]: idx }));
  };

  const next = async () => {
    if (!currentAnswered) return;
    if (!isLast) {
      setStep(step + 1);
      return;
    }
    setSubmitting(true);
    setError(null);
    const r = await submitQuizAttempt({ quizSlug: quiz.slug, answers });
    setSubmitting(false);
    if (!r.ok) {
      setError(r.error || "Fehler beim Speichern.");
      return;
    }
    setResult({
      score: r.score ?? 0,
      max_score: r.max_score ?? 0,
      correct_answers: r.correct_answers ?? {},
    });
  };

  const restart = () => {
    setStep(0);
    setAnswers({});
    setResult(null);
    setError(null);
  };

  if (result) {
    const pct = Math.round((result.score / result.max_score) * 100);
    const label =
      pct === 100 ? "Perfekt." :
      pct >= 80 ? "Stark." :
      pct >= 60 ? "Solide." :
      pct >= 40 ? "Geht noch." :
      "Liess die Kategorie nochmal nach.";

    return (
      <section className="border border-champagne/15 p-6 md:p-8">
        <p className="eyebrow mb-3">Ergebnis</p>
        <h2 className="font-display italic text-cream text-4xl md:text-5xl leading-tight mb-2">
          <span className="text-champagne">{result.score}</span>
          <span className="text-cream/55"> / {result.max_score}</span>
        </h2>
        <p className="text-cream/65 text-base md:text-lg mb-8">{label}</p>

        <div className="space-y-4 mb-8">
          {quiz.questions.map((q, i) => {
            const mine = answers[String(i)];
            const right = result.correct_answers[String(i)];
            const isRight = mine === right;
            return (
              <div key={i} className="border-t border-champagne/10 pt-4">
                <p className="text-cream text-sm font-medium mb-2">
                  {i + 1}. {q.q}
                </p>
                <p className={`text-sm ${isRight ? "text-champagne" : "text-cream/55"}`}>
                  Deine Antwort: {q.options[mine]} {isRight && "✓"}
                </p>
                {!isRight && (
                  <p className="text-cream/65 text-sm mt-1">
                    Richtig waere: <span className="text-champagne">{q.options[right]}</span>
                  </p>
                )}
                {q.explanation && (
                  <p className="text-cream/45 text-xs italic mt-2 leading-relaxed">
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={restart}
            className="btn-cta btn-shimmer"
          >
            Nochmal
            <span className="btn-cta-arrow" aria-hidden>→</span>
          </button>
          <Link
            href="/portal/academy/quiz"
            className="text-cream/55 hover:text-champagne text-[10px] uppercase tracking-[0.25em]"
          >
            Andere Quiz
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="border border-champagne/15 p-6 md:p-8">
      <div className="flex items-baseline justify-between mb-6">
        <p className="eyebrow">Frage {step + 1} von {quiz.questions.length}</p>
        <div className="flex gap-1">
          {quiz.questions.map((_, i) => (
            <span
              key={i}
              className={`block w-2 h-2 ${
                i < step ? "bg-champagne" :
                i === step ? "bg-champagne/60" :
                "bg-champagne/15"
              }`}
            />
          ))}
        </div>
      </div>

      <h2 className="font-display italic text-cream text-2xl md:text-3xl leading-tight mb-6">
        {currentQ.q}
      </h2>

      <div className="space-y-2 mb-8">
        {currentQ.options.map((opt, idx) => {
          const selected = answers[String(step)] === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => pick(idx)}
              className={`w-full text-left p-4 border transition-all ${
                selected
                  ? "border-champagne bg-champagne/10 text-champagne"
                  : "border-champagne/15 hover:border-champagne/50 text-cream/85"
              }`}
            >
              <span className="text-cream/40 text-xs mr-3 font-mono">
                {String.fromCharCode(65 + idx)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-champagne/70 text-xs italic mb-4">{error}</p>
      )}

      <div className="flex items-center gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="text-cream/55 hover:text-champagne text-[10px] uppercase tracking-[0.25em]"
          >
            ← Zurueck
          </button>
        )}
        <button
          type="button"
          onClick={next}
          disabled={!currentAnswered || submitting}
          className="btn-cta btn-shimmer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "Werte aus…" : isLast ? "Auswerten" : "Weiter"}
          {!submitting && <span className="btn-cta-arrow" aria-hidden>→</span>}
        </button>
      </div>
    </section>
  );
}
