import type { Habit } from "@/types";
import { getActivity, type GoalKind } from "@/lib/habitCatalog";

const MONEY_UNITS = ["Rupiah", "Rp", "IDR", "rupiah", "Rp.", "IDR "];

export function isMoneyUnit(unit: string | null): boolean {
  if (!unit) return false;
  return MONEY_UNITS.some(
    (m) => unit.trim().toLowerCase() === m.trim().toLowerCase()
  );
}

export function formatGoalValue(value: number | null, unit: string | null): string {
  if (value == null) return "";
  if (isMoneyUnit(unit)) {
    return `Rp${Math.round(value).toLocaleString("id-ID")}`;
  }
  const unitPart = unit ? ` ${unit}` : "";
  const valuePart =
    Number.isInteger(value) ? value.toLocaleString("en-US") : String(value);
  return `${valuePart}${unitPart}`;
}

export function formatGoal(habit: Pick<Habit, "goalLabel" | "goalValue" | "goalUnit">): {
  label: string;
  value: string;
} {
  return {
    label: habit.goalLabel ?? "Session Goal",
    value: formatGoalValue(habit.goalValue, habit.goalUnit),
  };
}

export function resolveGoalKind(
  habit: Pick<Habit, "category" | "activity" | "goalLabel" | "goalUnit">
): GoalKind {
  const activity = habit.activity
    ? getActivity(habit.category, habit.activity)
    : undefined;

  if (activity?.goal.kind && activity.goal.kind !== "custom") {
    return activity.goal.kind;
  }

  const label = (habit.goalLabel ?? "").toLowerCase();

  if (label.includes("duration") || label.includes("minutes")) return "duration";
  if (label.includes("distance") || label.includes("km")) return "distance";
  if (label.includes("repetitions") || label.includes("reps")) return "counter";
  if (label.includes("water") || label.includes("glasses")) return "counter";
  if (label.includes("times")) return "counter";
  if (label.includes("entries")) return "counter";
  if (label.includes("pages")) return "pages";
  if (label.includes("sleep") || label.includes("hours")) return "sleep";
  if (label.includes("goal") || isMoneyUnit(habit.goalUnit)) return "money";

  return "custom";
}

const TIME_UNITS = [
  "minutes",
  "minute",
  "min",
  "mins",
  "hours",
  "hour",
  "hr",
  "h",
  "menit",
];

// Duration-style goals run a real timer. Everything else shows a mission goal.
export function isTimedSession(habit: Pick<Habit, "category" | "activity" | "goalLabel" | "goalUnit">): boolean {
  if (resolveGoalKind(habit) === "duration") return true;
  // Time-based units mean a countdown even when the label is user-specific
  // (e.g. "Hafalan" with unit "Minutes").
  const unit = (habit.goalUnit ?? "").trim().toLowerCase();
  if (TIME_UNITS.includes(unit)) return true;
  // Legacy habits without any goal metadata default to a timed session so they
  // keep the original difficulty-based timer behavior until migrated.
  return !habit.goalLabel && !habit.goalUnit && !habit.activity;
}

export function goalIconKey(
  habit: Pick<Habit, "category" | "activity" | "goalLabel" | "goalUnit">
): string {
  const kind = resolveGoalKind(habit);
  const label = (habit.goalLabel ?? "").toLowerCase();
  if (label.includes("water")) return "water";
  if (label.includes("sleep")) return "sleep";
  if (label.includes("money") || label.includes("saving") || label.includes("budget") || label.includes("investment")) return "money";
  if (label.includes("pages") || label.includes("read")) return "pages";
  if (label.includes("repetitions") || label.includes("reps")) return "counter";
  if (label.includes("distance") || label.includes("km")) return "distance";
  return kind;
}
