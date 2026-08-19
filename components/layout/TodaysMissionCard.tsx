"use client";

import Link from "next/link";
import {
  Target,
  BookOpen,
  Dumbbell,
  Flower2,
  Code2,
  HeartPulse,
  CheckSquare,
  Wallet,
  Languages,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useDashboard } from "@/hooks/useDashboard";
import { formatGoal } from "@/lib/habitGoal";
import type { LucideIcon } from "lucide-react";
import type { HabitCategory } from "@/types";

const categoryIcons: Partial<Record<HabitCategory, LucideIcon>> = {
  Learning: BookOpen,
  Fitness: Dumbbell,
  Reading: BookOpen,
  Meditation: Flower2,
  Coding: Code2,
  Health: HeartPulse,
  Productivity: CheckSquare,
  Finance: Wallet,
  Language: Languages,
  Custom: Sparkles,
};

function categoryIcon(category: HabitCategory): LucideIcon {
  return categoryIcons[category] ?? Sparkles;
}

interface TodaysMissionCardProps {
  collapsed: boolean;
}

export default function TodaysMissionCard({
  collapsed,
}: TodaysMissionCardProps) {
  const { todayHabits, completedToday, totalToday } = useDashboard();

  const activeHabit = todayHabits.find((h) => !h.isCompleted);
  const allDone = totalToday > 0 && !activeHabit;

  const unfoldDelay = collapsed ? "0ms" : "140ms";

  const compactTitle =
    totalToday === 0
      ? "No active mission"
      : allDone
        ? "All missions complete!"
        : (activeHabit?.title ?? "Today's mission");

  const compactTile =
    totalToday === 0 ? (
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1F5F9]">
        <Target className="h-4 w-4 text-[#94A3B8]" aria-hidden="true" />
      </div>
    ) : allDone ? (
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#10B981]/10">
        <CheckCircle2 className="h-4 w-4 text-[#10B981]" aria-hidden="true" />
      </div>
    ) : (
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB]/10">
        <Target className="h-4 w-4 text-[#2563EB]" aria-hidden="true" />
      </div>
    );

  const missionContent = (
    <>
      {totalToday === 0 ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F1F5F9]">
              <Target className="h-3.5 w-3.5 text-[#64748B]" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-[#0F172A]">
              No active mission
            </p>
          </div>
          <p className="text-[11px] leading-snug text-[#64748B]">
            Choose a habit to begin your journey.
          </p>
          <Link
            href="/habits"
            className="mt-1.5 inline-flex w-fit items-center gap-1.5 rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 focus-visible:ring-offset-1"
          >
            <Target className="h-3.5 w-3.5" aria-hidden="true" />
            View Habits
          </Link>
        </div>
      ) : allDone ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#10B981]/10">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-[#10B981]">
              All missions complete!
            </p>
          </div>
          <p className="text-[11px] leading-snug text-[#64748B]">
            Great work today. See you tomorrow.
          </p>
        </div>
      ) : activeHabit ? (
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2563EB]/10">
              {(() => {
                const Icon = categoryIcon(activeHabit.category);
                return (
                  <Icon className="h-4 w-4 text-[#2563EB]" aria-hidden="true" />
                );
              })()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold leading-tight text-[#0F172A]">
                {activeHabit.title}
              </p>
              <p className="truncate text-[11px] text-[#64748B]">
                {activeHabit.category} &middot; {activeHabit.xpReward} XP
              </p>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px]">
            <span className="font-medium text-[#64748B]">Target</span>
            <span className="font-semibold text-[#0F172A]">
              {formatGoal(activeHabit).value || "Complete today"}
            </span>
          </div>

          <div className="mt-1.5">
            <div
              className="h-1.5 overflow-hidden rounded-full bg-[#E8EEF5]"
              role="progressbar"
              aria-valuenow={completedToday}
              aria-valuemin={0}
              aria-valuemax={totalToday}
              aria-label="Today's mission progress"
            >
              <div
                className="h-full rounded-full bg-[#10B981] transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min(
                    (completedToday / totalToday) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
            <p className="mt-1 text-right text-[10px] font-medium text-[#94A3B8]">
              {completedToday} / {totalToday} completed today
            </p>
          </div>
        </div>
      ) : null}
    </>
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_2px_10px_rgba(37,99,235,0.06)] transition-all duration-300",
        collapsed ? "h-12 w-12" : "h-[164px]"
      )}
      aria-label={collapsed ? undefined : "Today's mission"}
    >
      {/* Expanded mission card */}
      <div
        inert={collapsed}
        style={{ transitionDelay: unfoldDelay }}
        className={cn(
          "absolute inset-0 flex flex-col p-4 transition-all duration-300",
          collapsed ? "scale-95 opacity-0" : "scale-100 opacity-100"
        )}
        aria-hidden={collapsed}
      >
        <div className="flex items-center gap-1.5">
          <Target className="h-3 w-3 text-[#2563EB]" aria-hidden="true" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
            Today&apos;s Mission
          </p>
        </div>
        <div className="mt-2.5 flex-1">{missionContent}</div>
      </div>

      {/* Compact mission tile */}
      <div
        inert={!collapsed}
        style={{ transitionDelay: unfoldDelay }}
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-300",
          collapsed ? "scale-100 opacity-100" : "scale-90 opacity-0"
        )}
        aria-hidden={!collapsed}
        role="img"
        aria-label="Today's mission"
        title={compactTitle}
      >
        {compactTile}
      </div>
    </div>
  );
}
