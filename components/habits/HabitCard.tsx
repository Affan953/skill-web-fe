"use client";

import {
  CalendarDays,
  Check,
  Clock,
  Flame,
  Pencil,
  Play,
  Target,
  Trash2,
} from "lucide-react";
import type { Habit } from "@/types";
import { cn } from "@/lib/cn";
import { formatGoal } from "@/lib/habitGoal";
import { formatHabitCreated } from "@/lib/dateFormat";
import {
  CATEGORY_CHIP,
  CategoryIcon,
  CATEGORY_ICON_STYLE,
  DIFFICULTY_CHIP,
} from "@/components/habits/habitUi";

interface HabitCardProps {
  habit: Habit;
  onStart: (habit: Habit) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
}

export default function HabitCard({
  habit,
  onStart,
  onEdit,
  onDelete,
}: HabitCardProps) {
  const goal = formatGoal(habit);
  const showGoal = Boolean(habit.goalLabel && habit.goalValue != null);

  return (
    <div
      className={cn(
        "group rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200",
        habit.isCompleted
          ? "border-[#10B981]/25 bg-gradient-to-br from-[#10B981]/5 via-white to-white"
          : "border-slate-200/80 hover:-translate-y-0.5 hover:border-[#2563EB]/25 hover:shadow-lg hover:shadow-[#2563EB]/5"
      )}
    >
      <div className="flex items-start gap-4">
        <button
          onClick={() => !habit.isCompleted && onStart(habit)}
          disabled={habit.isCompleted}
          title={habit.isCompleted ? "Completed" : "Start session"}
          aria-label={habit.isCompleted ? "Completed" : "Start session"}
          className={cn(
            "group/check mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
            habit.isCompleted
              ? "cursor-default border-[#10B981] bg-[#10B981] text-white shadow-md shadow-[#10B981]/30"
              : "border-[#CBD5E1] text-[#2563EB] hover:border-[#2563EB] hover:bg-[#2563EB] hover:text-white hover:shadow-md hover:shadow-[#2563EB]/25"
          )}
        >
          {habit.isCompleted ? (
            <Check className="h-5 w-5" strokeWidth={3} />
          ) : (
            <Play className="h-4 w-4 fill-current opacity-0 transition-opacity duration-200 group-hover/check:opacity-100" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4
              className={cn(
                "text-sm font-semibold",
                habit.isCompleted
                  ? "text-[#94A3B8] line-through"
                  : "text-[#0F172A]"
              )}
            >
              {habit.title}
            </h4>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                CATEGORY_CHIP[habit.category]
              )}
            >
              {habit.category}
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold tabular-nums",
                DIFFICULTY_CHIP[habit.difficulty]
              )}
            >
              {habit.difficulty} &middot; {habit.xpReward} XP
            </span>
            {habit.activity && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                {habit.activity}
              </span>
            )}
          </div>

          {habit.description && (
            <p className="mt-1.5 text-xs leading-relaxed text-[#64748B]">
              {habit.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {habit.reminderTime && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#64748B]">
                <Clock className="h-3 w-3 text-[#94A3B8]" />
                {habit.reminderTime}
              </span>
            )}
            {habit.streak > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#10B981]">
                <Flame className="h-3 w-3" />
                {habit.streak} {habit.streak === 1 ? "day" : "days"} streak
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#94A3B8]">
              <CalendarDays className="h-3 w-3" />
              {formatHabitCreated(habit.createdAt)}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => onEdit(habit)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#94A3B8] transition-all duration-200 hover:bg-[#2563EB]/10 hover:text-[#2563EB]"
            title="Edit habit"
            aria-label="Edit habit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(habit)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#94A3B8] transition-all duration-200 hover:bg-red-500/10 hover:text-red-500"
            title="Delete habit"
            aria-label="Delete habit"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#94A3B8]">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-lg",
                CATEGORY_ICON_STYLE[habit.category]
              )}
            >
              <CategoryIcon category={habit.category} className="h-3.5 w-3.5" />
            </span>
            {habit.category}
          </span>
          {showGoal && (
            <span className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB]/5 px-3 py-1.5">
              <Target className="h-3.5 w-3.5 text-[#2563EB]" />
              <span className="text-[11px] font-medium text-[#64748B]">
                {goal.label}
              </span>
              <span className="text-xs font-bold tabular-nums text-[#2563EB]">
                {goal.value}
              </span>
            </span>
          )}
        </div>

        {habit.isCompleted ? (
          <span className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#10B981]/10 px-4 text-xs font-semibold text-[#10B981]">
            <Check className="h-4 w-4" strokeWidth={3} />
            Completed
          </span>
        ) : (
          <button
            onClick={() => onStart(habit)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#2563EB]/10 px-4 text-xs font-semibold text-[#2563EB] transition-all duration-200 hover:bg-[#2563EB] hover:text-white hover:shadow-md hover:shadow-[#2563EB]/25"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Start Session
          </button>
        )}
      </div>
    </div>
  );
}
