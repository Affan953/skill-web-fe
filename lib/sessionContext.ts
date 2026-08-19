import type { HabitCategory } from "@/types";

/**
 * Contextual motivational messages for the focus session, keyed by category.
 * Messages are designed to enhance the experience without being distracting.
 */
export const CATEGORY_MOTIVATIONAL_MESSAGES: Record<HabitCategory, string[]> = {
  Learning: [
    "Stay curious. Small sessions compound into real knowledge.",
    "Every concept you grasp builds on the last.",
    "Understanding takes time. Trust the process.",
    "Learning is a marathon, not a sprint.",
    "Your brain is growing with every minute.",
  ],
  Coding: [
    "One focused session moves the project forward.",
    "Good code is written one line at a time.",
    "Every bug you fix makes you sharper.",
    "Shipping beats perfecting.",
    "Focus on the problem, the solution will follow.",
  ],
  Fitness: [
    "Consistency matters more than intensity.",
    "Your body is your greatest instrument.",
    "Every rep, every step — it all counts.",
    "Strength is built in small moments.",
    "Show up for yourself today.",
  ],
  Reading: [
    "One page at a time builds a library of thought.",
    "Reading is thinking with someone else's mind.",
    "Every chapter opens a new perspective.",
    "The best investment is in your own mind.",
    "Let the words do the work.",
  ],
  Meditation: [
    "Stillness is strength.",
    "Breathe in clarity, breathe out noise.",
    "Your mind is learning to be quiet.",
    "Peace comes from practice, not perfection.",
    "This moment is enough.",
  ],
  Health: [
    "Small healthy choices compound into big results.",
    "Your body hears everything your mind says.",
    "Hydration, rest, movement — the basics matter.",
    "Health is the foundation of everything.",
    "Take care of the only body you have.",
  ],
  Productivity: [
    "Deep work creates deep results.",
    "One task at a time. Full attention.",
    "Eliminate distractions, amplify output.",
    "Focused hours beat scattered days.",
    "Progress is made in the deep end.",
  ],
  Finance: [
    "Every small save is a step toward freedom.",
    "Financial discipline is self-respect in action.",
    "Your future self benefits from today's choices.",
    "Track, plan, grow.",
    "Money managed well is money that works for you.",
  ],
  Language: [
    "Every word you learn expands your world.",
    "Language is the road map of a culture.",
    "Practice makes permanent.",
    "Fluency is built one conversation at a time.",
    "Your accent is a badge of courage.",
  ],
  Custom: [
    "Small steps every day lead to big changes.",
    "Your future self will thank you.",
    "Discipline is choosing between what you want now and what you want most.",
    "Consistency beats intensity.",
    "Progress, not perfection.",
  ],
};

/**
 * Returns a deterministic motivational message for a habit based on its title hash.
 */
export function getMotivationalMessage(
  category: HabitCategory,
  title: string
): string {
  const messages = CATEGORY_MOTIVATIONAL_MESSAGES[category] ?? CATEGORY_MOTIVATIONAL_MESSAGES.Custom;
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) | 0;
  }
  return messages[Math.abs(hash) % messages.length];
}

/**
 * Contextual proof-of-progress prompts based on category.
 * Returns a prompt string that asks the user about their actual activity.
 */
export const CATEGORY_PROOF_PROMPTS: Record<HabitCategory, string> = {
  Learning: "What did you learn during this session?",
  Coding: "What did you build or complete?",
  Fitness: "What did you accomplish?",
  Reading: "What did you read or understand?",
  Meditation: "How was your session?",
  Health: "What did you do for your health?",
  Productivity: "What did you accomplish?",
  Finance: "What did you do with your finances?",
  Language: "What did you practice or learn?",
  Custom: "What did you accomplish?",
};

/**
 * Returns the contextual proof prompt for a habit.
 */
export function getProofPrompt(
  category: HabitCategory,
  _activity?: string | null, // eslint-disable-line @typescript-eslint/no-unused-vars
): string {
  return CATEGORY_PROOF_PROMPTS[category] ?? CATEGORY_PROOF_PROMPTS.Custom;
}

/**
 * Returns the user-facing activity display name.
 * Handles unknown/custom activities gracefully.
 */
export function getActivityDisplayName(
  activity: string | null | undefined,
  category: HabitCategory,
  title: string
): string {
  if (activity && activity.trim()) return activity.trim();
  return title;
}

/**
 * Returns the category emoji for display.
 */
export const CATEGORY_EMOJI_MAP: Record<HabitCategory, string> = {
  Learning: "📚",
  Coding: "💻",
  Fitness: "💪",
  Reading: "📖",
  Meditation: "🧘",
  Health: "💚",
  Productivity: "⚡",
  Finance: "💰",
  Language: "🗣️",
  Custom: "🎯",
};
