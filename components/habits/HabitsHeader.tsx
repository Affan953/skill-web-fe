"use client";

import { useState } from "react";
import { Plus, CalendarDays } from "lucide-react";
import { formatTodayLong } from "@/lib/dateFormat";

interface HabitsHeaderProps {
  onNewHabit: () => void;
}

export default function HabitsHeader({ onNewHabit }: HabitsHeaderProps) {
  const [todayLabel] = useState(() => formatTodayLong(new Date()));

  return (
    <section className="mb-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-[#2563EB]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#2563EB]">
            <CalendarDays className="h-3 w-3" />
            Habit Command Center
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">
            Habits
          </h1>
          <p
            className="mt-1.5 text-sm text-[#64748B]"
            suppressHydrationWarning
          >
            {todayLabel} &middot; Keep your daily rhythm and grow.
          </p>
        </div>
        <button
          onClick={onNewHabit}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-6 text-sm font-semibold text-white shadow-lg shadow-[#2563EB]/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#2563EB]/30 active:translate-y-0"
        >
          <Plus className="h-4 w-4" />
          New Habit
        </button>
      </div>
    </section>
  );
}
