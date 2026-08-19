import type { HabitCategory } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Activity & Session Goal Catalog
//
// The USER always decides their own session target. The app only offers smart
// suggestions per activity. Every value is editable at creation time.
// ─────────────────────────────────────────────────────────────────────────────

export type GoalKind =
  | "duration"
  | "distance"
  | "counter"
  | "pages"
  | "sleep"
  | "money"
  | "custom";

export interface GoalTemplate {
  label: string;
  unit: string;
  defaultValue: number;
  kind: GoalKind;
  step?: number;
}

export interface ActivityDefinition {
  name: string;
  goal: GoalTemplate;
}

export interface CategoryDefinition {
  category: HabitCategory;
  label: string;
  emoji: string;
  activities: ActivityDefinition[];
}

export const CATEGORY_ORDER: HabitCategory[] = [
  "Learning",
  "Coding",
  "Fitness",
  "Reading",
  "Health",
  "Finance",
  "Productivity",
  "Meditation",
  "Custom",
];

export const HABIT_CATEGORIES: CategoryDefinition[] = [
  {
    category: "Learning",
    label: "Learning",
    emoji: "📚",
    activities: [
      { name: "English", goal: { label: "Study Duration", unit: "Minutes", defaultValue: 45, kind: "duration" } },
      { name: "Japanese", goal: { label: "Study Duration", unit: "Minutes", defaultValue: 45, kind: "duration" } },
      { name: "Programming Course", goal: { label: "Study Duration", unit: "Minutes", defaultValue: 60, kind: "duration" } },
      { name: "Mathematics", goal: { label: "Study Duration", unit: "Minutes", defaultValue: 45, kind: "duration" } },
      { name: "Research", goal: { label: "Study Duration", unit: "Minutes", defaultValue: 60, kind: "duration" } },
    ],
  },
  {
    category: "Coding",
    label: "Coding",
    emoji: "💻",
    activities: [
      { name: "Build Feature", goal: { label: "Session Duration", unit: "Minutes", defaultValue: 120, kind: "duration" } },
      { name: "Fix Bug", goal: { label: "Session Duration", unit: "Minutes", defaultValue: 90, kind: "duration" } },
      { name: "LeetCode", goal: { label: "Session Duration", unit: "Minutes", defaultValue: 45, kind: "duration" } },
      { name: "Code Review", goal: { label: "Session Duration", unit: "Minutes", defaultValue: 45, kind: "duration" } },
      { name: "Refactoring", goal: { label: "Session Duration", unit: "Minutes", defaultValue: 90, kind: "duration" } },
    ],
  },
  {
    category: "Fitness",
    label: "Fitness",
    emoji: "💪",
    activities: [
      { name: "Running", goal: { label: "Target Distance", unit: "KM", defaultValue: 5, kind: "distance" } },
      { name: "Walking", goal: { label: "Target Distance", unit: "KM", defaultValue: 3, kind: "distance" } },
      { name: "Jogging", goal: { label: "Target Distance", unit: "KM", defaultValue: 5, kind: "distance" } },
      { name: "Cycling", goal: { label: "Target Distance", unit: "KM", defaultValue: 15, kind: "distance" } },
      { name: "Swimming", goal: { label: "Target Distance", unit: "KM", defaultValue: 1, kind: "distance", step: 0.5 } },
      { name: "Badminton", goal: { label: "Session Duration", unit: "Minutes", defaultValue: 60, kind: "duration" } },
      { name: "Football", goal: { label: "Session Duration", unit: "Minutes", defaultValue: 90, kind: "duration" } },
      { name: "Basketball", goal: { label: "Session Duration", unit: "Minutes", defaultValue: 90, kind: "duration" } },
      { name: "Gym Workout", goal: { label: "Session Duration", unit: "Minutes", defaultValue: 75, kind: "duration" } },
      { name: "Push Up", goal: { label: "Target Repetitions", unit: "Reps", defaultValue: 50, kind: "counter" } },
      { name: "Pull Up", goal: { label: "Target Repetitions", unit: "Reps", defaultValue: 20, kind: "counter" } },
      { name: "Yoga", goal: { label: "Session Duration", unit: "Minutes", defaultValue: 45, kind: "duration" } },
      { name: "Stretching", goal: { label: "Session Duration", unit: "Minutes", defaultValue: 15, kind: "duration" } },
    ],
  },
  {
    category: "Reading",
    label: "Reading",
    emoji: "📖",
    activities: [
      { name: "Book", goal: { label: "Pages to Read", unit: "Pages", defaultValue: 20, kind: "pages" } },
      { name: "Novel", goal: { label: "Pages to Read", unit: "Pages", defaultValue: 20, kind: "pages" } },
      { name: "Documentation", goal: { label: "Pages to Read", unit: "Pages", defaultValue: 20, kind: "pages" } },
      { name: "Research Paper", goal: { label: "Pages to Read", unit: "Pages", defaultValue: 10, kind: "pages" } },
      { name: "Article", goal: { label: "Pages to Read", unit: "Pages", defaultValue: 5, kind: "pages" } },
    ],
  },
  {
    category: "Health",
    label: "Health",
    emoji: "💚",
    activities: [
      { name: "Drink Water", goal: { label: "Target Water Intake", unit: "Glasses", defaultValue: 8, kind: "counter" } },
      { name: "Sleep", goal: { label: "Target Sleep", unit: "Hours", defaultValue: 8, kind: "sleep", step: 0.5 } },
      { name: "Medicine", goal: { label: "Times Taken", unit: "Times", defaultValue: 1, kind: "counter" } },
      { name: "Morning Walk", goal: { label: "Target Distance", unit: "KM", defaultValue: 2, kind: "distance", step: 0.5 } },
      { name: "Stretch", goal: { label: "Session Duration", unit: "Minutes", defaultValue: 10, kind: "duration" } },
    ],
  },
  {
    category: "Finance",
    label: "Finance",
    emoji: "💰",
    activities: [
      { name: "Save Money", goal: { label: "Saving Goal", unit: "Rupiah", defaultValue: 50000, kind: "money", step: 5000 } },
      { name: "Track Expenses", goal: { label: "Expense Entries", unit: "Entries", defaultValue: 5, kind: "counter" } },
      { name: "Budget Planning", goal: { label: "Budget Goal", unit: "Rupiah", defaultValue: 100000, kind: "money", step: 10000 } },
      { name: "Investing", goal: { label: "Investment Goal", unit: "Rupiah", defaultValue: 50000, kind: "money", step: 5000 } },
    ],
  },
  {
    category: "Productivity",
    label: "Productivity",
    emoji: "⚡",
    activities: [
      { name: "Deep Work", goal: { label: "Focus Duration", unit: "Minutes", defaultValue: 90, kind: "duration" } },
      { name: "Task Management", goal: { label: "Focus Duration", unit: "Minutes", defaultValue: 60, kind: "duration" } },
      { name: "Email Cleanup", goal: { label: "Focus Duration", unit: "Minutes", defaultValue: 45, kind: "duration" } },
      { name: "Planning", goal: { label: "Focus Duration", unit: "Minutes", defaultValue: 60, kind: "duration" } },
    ],
  },
  {
    category: "Meditation",
    label: "Meditation",
    emoji: "🧘",
    activities: [
      { name: "Mindfulness", goal: { label: "Meditation Duration", unit: "Minutes", defaultValue: 20, kind: "duration" } },
      { name: "Breathing Exercise", goal: { label: "Meditation Duration", unit: "Minutes", defaultValue: 10, kind: "duration" } },
      { name: "Focus Session", goal: { label: "Meditation Duration", unit: "Minutes", defaultValue: 20, kind: "duration" } },
    ],
  },
  {
    category: "Custom",
    label: "Custom",
    emoji: "🎯",
    activities: [],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Goal Unit & Label Suggestions
//
// These are OPTIONAL convenience suggestions only. They never constrain the
// user. The user can type any activity, any goal value and any goal unit the
// existing contract supports (activity/goalUnit are free-form strings).
// ─────────────────────────────────────────────────────────────────────────────

export const GOAL_UNIT_SUGGESTIONS = [
  "Minutes",
  "Hours",
  "Pages",
  "KM",
  "Reps",
  "Times",
  "Sessions",
  "Chapters",
  "Tasks",
];

const UNIT_LABEL_SUGGESTIONS: { match: string[]; label: string }[] = [
  { match: ["minutes", "min", "minute", "hours", "hour", "hr"], label: "Session Duration" },
  { match: ["pages", "page"], label: "Pages to Read" },
  { match: ["km", "kilometers", "kilometer", "kilometres", "miles", "mi", "meters", "metres", "m"], label: "Target Distance" },
  { match: ["reps", "repetitions", "repetition"], label: "Target Repetitions" },
  { match: ["times", "time"], label: "Times Completed" },
  { match: ["sessions", "session"], label: "Sessions Completed" },
  { match: ["chapters", "chapter"], label: "Chapters to Read" },
  { match: ["tasks", "task"], label: "Tasks Completed" },
  { match: ["glasses", "glass"], label: "Water Intake" },
  { match: ["rupiah", "rp", "idr", "usd", "dollars"], label: "Saving Goal" },
  { match: ["problems", "problem"], label: "Problems Solved" },
  { match: ["lessons", "lesson"], label: "Lessons Completed" },
  { match: ["books", "book"], label: "Books Read" },
  { match: ["words", "word"], label: "Words" },
  { match: ["questions", "question"], label: "Questions Completed" },
  { match: ["rooms", "room"], label: "Rooms Cleaned" },
];

/**
 * Neutral, human-readable label suggestion derived from the user's chosen unit.
 * The label is required by the existing contract so the user's own goal value
 * is preserved (the backend otherwise treats missing labels as legacy data).
 * The value itself is never suggested — only this descriptive label.
 */
export function suggestGoalLabelForUnit(unit: string): string {
  const u = (unit || "").trim().toLowerCase();
  if (!u) return "Session Goal";
  const found = UNIT_LABEL_SUGGESTIONS.find((g) =>
    g.match.some((m) => u === m || u.includes(m))
  );
  return found ? found.label : "Session Goal";
}

// Legacy category still supported for reading existing habits (not offered when
// creating new habits).
const LEGACY_CATEGORIES: CategoryDefinition[] = [
  {
    category: "Language",
    label: "Language",
    emoji: "🗣️",
    activities: [
      { name: "English", goal: { label: "Study Duration", unit: "Minutes", defaultValue: 45, kind: "duration" } },
      { name: "Japanese", goal: { label: "Study Duration", unit: "Minutes", defaultValue: 45, kind: "duration" } },
    ],
  },
];

const ALL_CATEGORIES: CategoryDefinition[] = [
  ...HABIT_CATEGORIES,
  ...LEGACY_CATEGORIES,
];

export function getCategory(
  category: HabitCategory
): CategoryDefinition | undefined {
  return ALL_CATEGORIES.find((c) => c.category === category);
}

export function getActivity(
  category: HabitCategory,
  activityName: string
): ActivityDefinition | undefined {
  return getCategory(category)?.activities.find((a) => a.name === activityName);
}

export const CATEGORY_EMOJI: Record<string, string> = Object.fromEntries(
  ALL_CATEGORIES.map((c) => [c.category, c.emoji])
);
