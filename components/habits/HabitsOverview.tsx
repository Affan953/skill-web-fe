"use client";

import { CheckCircle2, CircleCheck, Flame, Zap } from "lucide-react";
import type { Habit } from "@/types";
import { cn } from "@/lib/cn";

interface HabitsOverviewProps {
  habits: Habit[];
}

export default function HabitsOverview({ habits }: HabitsOverviewProps) {
  const totalHabits = habits.length;
  const completedToday = habits.filter((h) => h.isCompleted).length;
  const currentStreak =
    totalHabits > 0 ? Math.max(...habits.map((h) => h.streak), 0) : 0;
  const totalXP = habits.reduce(
    (sum, h) => sum + (h.isCompleted ? h.xpReward : 0),
    0
  );
  const progress =
    totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  const cards = [
    {
      label: "Total Habits",
      value: String(totalHabits),
      icon: <CheckCircle2 className="h-5 w-5" />,
      iconStyle: "bg-[#2563EB]/10 text-[#2563EB]",
      accent: "from-[#2563EB]/15 to-[#2563EB]/5",
    },
    {
      label: "Completed Today",
      value: `${completedToday} / ${totalHabits}`,
      icon: <CircleCheck className="h-5 w-5" />,
      iconStyle: "bg-[#10B981]/10 text-[#10B981]",
      accent: "from-[#10B981]/15 to-[#10B981]/5",
      progress,
    },
    {
      label: "Current Streak",
      value: `${currentStreak} ${currentStreak === 1 ? "day" : "days"}`,
      icon: <Flame className="h-5 w-5" />,
      iconStyle: "bg-[#F59E0B]/10 text-[#F59E0B]",
      accent: "from-[#F59E0B]/15 to-[#F59E0B]/5",
    },
    {
      label: "Total XP",
      value: totalXP.toLocaleString("en-US"),
      icon: <Zap className="h-5 w-5" />,
      iconStyle: "bg-[#8B5CF6]/10 text-[#8B5CF6]",
      accent: "from-[#8B5CF6]/15 to-[#8B5CF6]/5",
    },
  ];

  return (
    <section className="mb-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2563EB]/20 hover:shadow-lg hover:shadow-[#2563EB]/5"
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
                card.accent
              )}
            />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  {card.label}
                </p>
                <p className="mt-1.5 text-2xl font-bold tabular-nums text-[#0F172A]">
                  {card.value}
                </p>
              </div>
              <div
                className={cn(
                  "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl",
                  card.iconStyle
                )}
              >
                {card.icon}
              </div>
            </div>

            {card.progress !== undefined && totalHabits > 0 && (
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[10px] font-medium">
                  <span className="text-[#94A3B8]">Daily completion</span>
                  <span className="tabular-nums text-[#10B981]">
                    {card.progress}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#10B981] to-[#34D399] transition-all duration-500"
                    style={{ width: `${card.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
