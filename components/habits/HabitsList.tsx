"use client";

import { AlertTriangle, Loader2, Plus, Search, Sparkles } from "lucide-react";
import type { Habit } from "@/types";
import HabitCard from "@/components/habits/HabitCard";

interface HabitsListProps {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  habits: Habit[];
  totalHabits: number;
  hasActiveFilters: boolean;
  onNewHabit: () => void;
  onClearFilters: () => void;
  onStart: (habit: Habit) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
}

export default function HabitsList({
  isLoading,
  isError,
  error,
  habits,
  totalHabits,
  hasActiveFilters,
  onNewHabit,
  onClearFilters,
  onStart,
  onEdit,
  onDelete,
}: HabitsListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white py-24 shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
        <p className="mt-3 text-xs font-medium text-[#94A3B8]">
          Loading your habits...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-white px-6 py-20 text-center shadow-sm">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <p className="text-sm font-semibold text-[#0F172A]">
          Failed to load habits
        </p>
        <p className="mt-1 text-xs text-[#94A3B8]">
          {error?.message || "Please try again later."}
        </p>
      </div>
    );
  }

  if (totalHabits === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-6 py-20 text-center shadow-sm">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[#2563EB]/5 blur-3xl" />
        <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] shadow-lg shadow-[#2563EB]/25">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        <h3 className="text-lg font-bold text-[#0F172A]">
          Your command center awaits
        </h3>
        <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-[#64748B]">
          Build your first habit to start tracking progress, streaks, and XP.
          Small steps every day lead to big changes.
        </p>
        <button
          onClick={onNewHabit}
          className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-6 text-sm font-semibold text-white shadow-lg shadow-[#2563EB]/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#2563EB]/30"
        >
          <Plus className="h-4 w-4" />
          Create your first habit
        </button>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white px-6 py-20 text-center shadow-sm">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <Search className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-sm font-semibold text-[#0F172A]">
          No habits match your filters
        </p>
        <p className="mt-1 text-xs text-[#94A3B8]">
          Try adjusting your search or filters
        </p>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-semibold text-[#64748B] transition-all duration-200 hover:border-[#2563EB]/40 hover:text-[#2563EB]"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {habits.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          onStart={onStart}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
