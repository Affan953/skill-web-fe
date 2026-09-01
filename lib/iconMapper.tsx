"use client";

import type { LucideIcon, LucideProps } from "lucide-react";
import {
  BookOpen,
  Code,
  Dumbbell,
  BookText,
  Heart,
  Wallet,
  Zap,
  Brain,
  Languages,
  Sparkles,
  Footprints,
  Sprout,
  Crown,
  Target,
  Medal,
  Shield,
  Swords,
  Gem,
  Flame,
  Bomb,
  Diamond,
  Trophy,
  Award,
  Star,
} from "lucide-react";
import type { HabitCategory } from "@/types";

export const CATEGORY_ICON_MAP: Record<HabitCategory, LucideIcon> = {
  Learning: BookOpen,
  Coding: Code,
  Fitness: Dumbbell,
  Reading: BookText,
  Health: Heart,
  Finance: Wallet,
  Productivity: Zap,
  Meditation: Brain,
  Language: Languages,
  Custom: Sparkles,
};

const ACTIVITY_ICON_MAP: Record<string, LucideIcon> = {
  running: Dumbbell,
  walking: Footprints,
  jogging: Footprints,
  cycling: Dumbbell,
  swimming: Dumbbell,
  badminton: Dumbbell,
  football: Dumbbell,
  basketball: Dumbbell,
  "gym workout": Dumbbell,
  "push up": Dumbbell,
  "pull up": Dumbbell,
  yoga: Brain,
  stretching: Sparkles,
  stretch: Sparkles,
  book: BookText,
  novel: BookText,
  documentation: BookText,
  "research paper": BookText,
  article: BookText,
  english: Languages,
  japanese: Languages,
  mathematics: BookOpen,
  research: BookOpen,
  "programming course": Code,
  "build feature": Code,
  "fix bug": Code,
  leetcode: Code,
  "code review": Code,
  refactoring: Code,
  "save money": Wallet,
  "track expenses": Wallet,
  "budget planning": Wallet,
  investing: Wallet,
  mindfulness: Brain,
  "breathing exercise": Brain,
  "focus session": Brain,
  "drink water": Heart,
  sleep: Heart,
  medicine: Heart,
  "morning walk": Footprints,
  "deep work": Zap,
  "task management": Sparkles,
  "email cleanup": Sparkles,
  planning: Sparkles,
};

const ACHIEVEMENT_ICON_MAP: Record<string, LucideIcon> = {
  footprints: Footprints,
  sprout: Sprout,
  zap: Zap,
  crown: Crown,
  sparkles: Sparkles,
  target: Target,
  medal: Medal,
  shield: Shield,
  swords: Swords,
  gem: Gem,
  flame: Flame,
  bomb: Bomb,
  diamond: Diamond,
};

const ACHIEVEMENT_EMOJI_FALLBACK: Record<string, LucideIcon> = {
  "👣": Footprints,
  "🌱": Sprout,
  "⚡": Zap,
  "👑": Crown,
  "✨": Sparkles,
  "🎯": Target,
  "🏅": Medal,
  "🛡️": Shield,
  "⚔️": Swords,
  "🔮": Gem,
  "🔥": Flame,
  "☄️": Bomb,
  "💥": Diamond,
};

const CATEGORY_EMOJI_FALLBACK: Record<string, LucideIcon> = {
  "📚": BookOpen,
  "💻": Code,
  "💪": Dumbbell,
  "🏋️": Dumbbell,
  "📖": BookText,
  "🧘": Brain,
  "💚": Heart,
  "💰": Wallet,
  "⚡": Zap,
  "🗣️": Languages,
  "✨": Sparkles,
  "🎯": Target,
};

type GlyphProps = Omit<LucideProps, "ref">;

export function CategoryGlyph({
  category,
  ...props
}: GlyphProps & { category: HabitCategory | string }) {
  const Icon =
    CATEGORY_ICON_MAP[category as HabitCategory] ??
    CATEGORY_EMOJI_FALLBACK[category] ??
    Sparkles;
  return <Icon {...props} />;
}

export function AchievementGlyph({ icon, ...props }: GlyphProps & { icon: string }) {
  const code = icon?.trim().toLowerCase() ?? "";
  const Icon =
    ACHIEVEMENT_ICON_MAP[code] ??
    ACHIEVEMENT_EMOJI_FALLBACK[icon] ??
    Sparkles;
  return <Icon {...props} />;
}

export function ActivityGlyph({
  activity,
  category,
  ...props
}: GlyphProps & { activity?: string; category?: HabitCategory | string }) {
  const catKey = category as HabitCategory | undefined;
  let Icon: LucideIcon = CATEGORY_ICON_MAP[catKey as HabitCategory] ?? Sparkles;
  if (catKey && !(catKey in CATEGORY_ICON_MAP)) {
    Icon = CATEGORY_EMOJI_FALLBACK[catKey] ?? Sparkles;
  }
  if (activity && ACTIVITY_ICON_MAP[activity.trim().toLowerCase()]) {
    Icon = ACTIVITY_ICON_MAP[activity.trim().toLowerCase()];
  }
  return <Icon {...props} />;
}

export function MedalGlyph({ rank, ...props }: GlyphProps & { rank: number }) {
  const Icon =
    (rank === 1 && Trophy) || (rank === 2 && Medal) || (rank === 3 && Award) || Star;
  return <Icon {...props} />;
}
