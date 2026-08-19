"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock, Loader2, Save, Target, X } from "lucide-react";
import type { Habit, HabitCategory, HabitDifficulty } from "@/types";
import { cn } from "@/lib/cn";
import { formatGoalValue } from "@/lib/habitGoal";
import {
  GOAL_UNIT_SUGGESTIONS,
  getCategory,
  suggestGoalLabelForUnit,
} from "@/lib/habitCatalog";
import SuggestionChips, {
  type SuggestionChipItem,
} from "@/components/habits/SuggestionChips";

const CATEGORIES: HabitCategory[] = [
  "Learning",
  "Coding",
  "Fitness",
  "Reading",
  "Meditation",
  "Health",
  "Productivity",
  "Finance",
  "Language",
  "Custom",
];

const DIFFICULTIES: HabitDifficulty[] = ["Easy", "Medium", "Hard"];

const DIFFICULTY_XP: Record<HabitDifficulty, number> = {
  Easy: 10,
  Medium: 20,
  Hard: 30,
};

export interface EditHabitPayload {
  title: string;
  description?: string;
  category: HabitCategory;
  activity?: string;
  goalLabel?: string;
  goalValue?: number;
  goalUnit?: string;
  difficulty: HabitDifficulty;
  reminderTime?: string;
}

interface EditHabitModalProps {
  open: boolean;
  habit: Habit | null;
  onClose: () => void;
  onSubmit: (data: EditHabitPayload) => void;
  loading: boolean;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8]">
      {children}
    </p>
  );
}

export default function EditHabitModal({
  open,
  habit,
  onClose,
  onSubmit,
  loading,
}: EditHabitModalProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [title, setTitle] = useState(habit?.title ?? "");
  const [description, setDescription] = useState(habit?.description ?? "");
  const [category, setCategory] = useState<HabitCategory>(
    habit?.category ?? "Learning"
  );
  const [activity, setActivity] = useState(habit?.activity ?? "");
  const [goalLabel, setGoalLabel] = useState(habit?.goalLabel ?? "");
  const [goalValue, setGoalValue] = useState(
    habit?.goalValue != null ? String(habit.goalValue) : ""
  );
  const [goalUnit, setGoalUnit] = useState(habit?.goalUnit ?? "");
  const [difficulty, setDifficulty] = useState<HabitDifficulty>(
    habit?.difficulty ?? "Easy"
  );
  const [reminderTime, setReminderTime] = useState(habit?.reminderTime ?? "");

  const activitySuggestions = useMemo(() => {
    const all = getCategory(category)?.activities.map((a) => a.name) ?? [];
    const q = activity.trim().toLowerCase();
    return (q
      ? all.filter((name) => name.toLowerCase().includes(q))
      : all
    ).slice(0, 6);
  }, [category, activity]);

  const pickActivitySuggestion = (item: SuggestionChipItem) => {
    setActivity(item.label);
  };

  const pickUnitSuggestion = (item: SuggestionChipItem) => {
    setGoalUnit(item.label);
  };

  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setMounted(true);
          setVisible(true);
        })
      );
      return () => cancelAnimationFrame(raf);
    }
    const fadeTimer = setTimeout(() => setVisible(false), 0);
    const unmountTimer = setTimeout(() => setMounted(false), 300);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!mounted) return null;

  const goalValueNumber =
    goalValue !== "" ? parseFloat(goalValue) : null;
  const previewValue =
    goalValueNumber != null && !Number.isNaN(goalValueNumber)
      ? formatGoalValue(goalValueNumber, goalUnit)
      : "—";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      activity: activity.trim() || undefined,
      // A label keeps the backend from treating this habit as legacy and
      // silently replacing the user's goal value with difficulty-based minutes.
      goalLabel: goalLabel.trim() || suggestGoalLabelForUnit(goalUnit),
      goalValue:
        goalValueNumber != null && !Number.isNaN(goalValueNumber)
          ? goalValueNumber
          : undefined,
      goalUnit: goalUnit.trim() || undefined,
      difficulty,
      reminderTime: reminderTime || undefined,
    });
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300",
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Edit Habit"
    >
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={cn(
          "relative w-full max-w-[620px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white transition-all duration-300",
          visible
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-[0.97] opacity-0 translate-y-3"
        )}
        style={{
          boxShadow:
            "0 0 0 1px rgba(37,99,235,0.04), 0 8px 40px rgba(37,99,235,0.06), 0 20px 60px rgba(0,0,0,0.06)",
        }}
      >
        <div className="px-8 pt-8 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[#2563EB]">
                Edit Habit
              </p>
              <h2 className="text-2xl font-bold text-[#0F172A]">
                Edit your habit
              </h2>
              <p className="mt-1 text-xs text-[#64748B]">
                Update what you practice, your target, and how you track it.
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mx-8 h-px bg-slate-100" />

        <form onSubmit={handleSubmit} className="max-h-[60vh] overflow-y-auto px-8 py-6 space-y-6">
          <div>
            <SectionHeading>Habit Identity</SectionHeading>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-[#FAFBFC] px-5 py-3.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 focus:outline-none transition-all duration-200"
                  placeholder="e.g. Morning Run"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Activity
                  </label>
                  <input
                    type="text"
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 focus:outline-none transition-all duration-200"
                    placeholder="e.g. Learn English grammar"
                  />
                  {activitySuggestions.length > 0 && (
                    <div className="mt-2.5">
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                        Suggested — optional
                      </p>
                      <SuggestionChips
                        items={activitySuggestions.map((name) => ({
                          key: name.toLowerCase(),
                          label: name,
                        }))}
                        onPick={pickActivitySuggestion}
                        selectedKey={activity.trim().toLowerCase()}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as HabitCategory)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm text-[#0F172A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 focus:outline-none transition-all duration-200"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div>
            <SectionHeading>Session Goal</SectionHeading>
            <div className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-[#94A3B8]">
                    Goal Label
                  </label>
                  <input
                    type="text"
                    value={goalLabel}
                    onChange={(e) => setGoalLabel(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none"
                    placeholder="e.g. Target Distance"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-[#94A3B8]">
                    Value
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={goalValue}
                    onChange={(e) => setGoalValue(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm tabular-nums text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none"
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-[#94A3B8]">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={goalUnit}
                    onChange={(e) => setGoalUnit(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none"
                    placeholder="KM"
                  />
                  <div className="mt-2">
                    <SuggestionChips
                      items={GOAL_UNIT_SUGGESTIONS.map((u) => ({
                        key: u.toLowerCase(),
                        label: u,
                      }))}
                      onPick={pickUnitSuggestion}
                      selectedKey={goalUnit.trim().toLowerCase()}
                      className="gap-1.5"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#2563EB]/10 bg-white px-5 py-4">
                <span className="flex items-center gap-2 text-xs font-medium text-[#64748B]">
                  <Target className="h-3.5 w-3.5 text-[#2563EB]" />
                  {goalLabel.trim() || "Your Session Goal"}
                </span>
                <span className="text-lg font-bold tabular-nums text-[#2563EB]">
                  {previewValue}
                </span>
              </div>
            </div>
          </div>

          <div>
            <SectionHeading>Difficulty &amp; Schedule</SectionHeading>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={cn(
                        "rounded-xl border px-3 py-3 text-center transition-all duration-200",
                        difficulty === d
                          ? "border-[#2563EB] bg-[#2563EB]/5 shadow-md shadow-[#2563EB]/10"
                          : "border-slate-200 bg-white hover:border-[#2563EB]/40"
                      )}
                    >
                      <p
                        className={cn(
                          "text-xs font-bold",
                          difficulty === d ? "text-[#2563EB]" : "text-[#0F172A]"
                        )}
                      >
                        {d}
                      </p>
                      <p className="mt-0.5 text-[10px] font-medium tabular-nums text-[#10B981]">
                        +{DIFFICULTY_XP[d]} XP
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Reminder Time
                </label>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3.5 pl-11 text-sm text-[#0F172A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <SectionHeading>Notes</SectionHeading>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-xl border border-slate-200 bg-[#FAFBFC] px-5 py-3.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 focus:outline-none transition-all duration-200"
              placeholder="Optional — why this habit matters to you"
            />
          </div>
        </form>

        <div className="mx-8 h-px bg-slate-100" />

        <div className="flex gap-4 px-8 py-6">
          <button
            onClick={onClose}
            className="h-13 flex-1 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-[#64748B] transition-all duration-200 hover:bg-slate-50 hover:border-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !title.trim()}
            className="flex h-13 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-[#2563EB]/25 hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
