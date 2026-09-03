"use client";

import { useState } from "react";
import { X, Loader2, BookOpen } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Habit, HabitCategory } from "@/types";

interface ReflectionModalProps {
  open: boolean;
  habit: Habit | null;
  onClose: () => void;
  onSubmit: (data: {
    habitId: string;
    title: string;
    category: string;
    reflection: string;
    metrics?: Record<string, string>;
  }) => void;
  loading: boolean;
}

const CATEGORY_QUESTIONS: Record<
  HabitCategory,
  { question: string; key: string; placeholder: string }[]
> = {
  Language: [
    { question: "How was your session?", key: "mood", placeholder: "e.g. Great, I felt confident" },
    { question: "How long did you practice?", key: "duration", placeholder: "e.g. 45 minutes" },
    { question: "What's one thing you learned?", key: "takeaway", placeholder: "e.g. New vocabulary, grammar rule" },
  ],
  Coding: [
    { question: "What did you work on?", key: "focus", placeholder: "e.g. Built a REST API endpoint" },
    { question: "How was your focus?", key: "energy", placeholder: "e.g. High, got into flow state" },
    { question: "Any bugs or challenges?", key: "challenge", placeholder: "e.g. Struggled with async/await" },
  ],
  Fitness: [
    { question: "How was your workout?", key: "mood", placeholder: "e.g. Energizing, tough but good" },
    { question: "Duration?", key: "duration", placeholder: "e.g. 45 minutes" },
    { question: "How do you feel after?", key: "energy", placeholder: "e.g. Strong, tired but happy" },
  ],
  Reading: [
    { question: "What did you read?", key: "title", placeholder: "e.g. Chapter 5 of Atomic Habits" },
    { question: "How was your focus?", key: "focus", placeholder: "e.g. Deeply engaged" },
    { question: "Key takeaway?", key: "takeaway", placeholder: "e.g. Habit stacking is powerful" },
  ],
  Meditation: [
    { question: "How was your session?", key: "mood", placeholder: "e.g. Calm, centered" },
    { question: "Duration?", key: "duration", placeholder: "e.g. 20 minutes" },
    { question: "What did you notice?", key: "takeaway", placeholder: "e.g. Mind was less wandering" },
  ],
  Health: [
    { question: "How are you feeling?", key: "mood", placeholder: "e.g. Good, energized" },
    { question: "Sleep quality?", key: "sleepQuality", placeholder: "e.g. 7/10, fell asleep quickly" },
    { question: "What did you do for your health?", key: "note", placeholder: "e.g. Drank 8 glasses of water" },
  ],
  Productivity: [
    { question: "What did you accomplish?", key: "focus", placeholder: "e.g. Finished 3 tasks" },
    { question: "Time spent?", key: "timeSpent", placeholder: "e.g. 2 focused hours" },
    { question: "What was most valuable?", key: "takeaway", placeholder: "e.g. Deep work in the morning" },
  ],
  Finance: [
    { question: "What did you do?", key: "note", placeholder: "e.g. Tracked expenses, saved $20" },
    { question: "How much?", key: "amount", placeholder: "e.g. Saved $50" },
    { question: "Why is this important?", key: "reason", placeholder: "e.g. Building an emergency fund" },
  ],
  Custom: [
    { question: "How was it?", key: "mood", placeholder: "e.g. Good, productive" },
    { question: "Any notes?", key: "note", placeholder: "e.g. Made progress on my goal" },
    { question: "What's next?", key: "nextGoal", placeholder: "e.g. Continue tomorrow" },
  ],
  Learning: [
    { question: "What did you learn?", key: "takeaway", placeholder: "e.g. New concept in ML" },
    { question: "How was your focus?", key: "focus", placeholder: "e.g. Highly focused" },
    { question: "Duration?", key: "duration", placeholder: "e.g. 1 hour" },
  ],
  Uncategorized: [
    { question: "How was it?", key: "mood", placeholder: "e.g. Good, productive" },
    { question: "Any notes?", key: "note", placeholder: "e.g. Made progress on my goal" },
    { question: "What's next?", key: "nextGoal", placeholder: "e.g. Continue tomorrow" },
  ],
};

export default function ReflectionModal({
  open,
  habit,
  onClose,
  onSubmit,
  loading,
}: ReflectionModalProps) {
  const [reflection, setReflection] = useState("");
  const [metrics, setMetrics] = useState<Record<string, string>>({});

  if (!open || !habit) return null;

  const questions = CATEGORY_QUESTIONS[habit.category] ?? CATEGORY_QUESTIONS.Custom;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflection.trim()) return;
    onSubmit({
      habitId: habit.id,
      title: habit.title,
      category: habit.category,
      reflection: reflection.trim(),
      metrics: Object.keys(metrics).length > 0 ? metrics : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(15,23,42,0.6)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-white/95 max-h-[90vh] overflow-y-auto" style={{ boxShadow: "0 0 0 1px rgba(37,99,235,0.08), 0 8px 40px rgba(37,99,235,0.12), 0 30px 80px rgba(0,0,0,0.25)" }}>
      <div className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB]/10">
              <BookOpen className="h-5 w-5 text-[#2563EB]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Growth Reflection
              </h3>
              <p className="text-xs text-slate-500">
                Reflect on: {habit.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 transition-colors hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {questions.map((q) => (
            <div key={q.key}>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                {q.question}
              </label>
              <input
                type="text"
                value={metrics[q.key] || ""}
                onChange={(e) =>
                  setMetrics({ ...metrics, [q.key]: e.target.value })
                }
                placeholder={q.placeholder}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none"
              />
            </div>
          ))}

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Your reflection * (required)
            </label>
            <textarea
              required
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={4}
              placeholder="How did this go? What did you learn? What will you do differently next time?"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none"
            />
          </div>

          <div className="rounded-lg bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-500">
              Earn <span className="font-semibold text-[#10B981]">{habit.xpReward} XP</span> after saving your reflection
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-100"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={loading || !reflection.trim()}
              className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Reflection
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
