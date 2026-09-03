import {
  BookOpen,
  BookText,
  Brain,
  Briefcase,
  Code,
  Dumbbell,
  Heart,
  Languages,
  Smile,
  Sparkles,
  Wallet,
  CircleDashed,
} from "lucide-react";
import type { HabitCategory, HabitDifficulty } from "@/types";

export const CATEGORY_OPTIONS: HabitCategory[] = [
  "Learning",
  "Fitness",
  "Reading",
  "Meditation",
  "Coding",
  "Health",
  "Productivity",
  "Finance",
  "Language",
  "Custom",
  "Uncategorized",
];

export const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Learning: BookOpen,
  Coding: Code,
  Fitness: Dumbbell,
  Reading: BookText,
  Health: Heart,
  Finance: Wallet,
  Productivity: Briefcase,
  Meditation: Brain,
  Language: Languages,
  Custom: Smile,
  Uncategorized: CircleDashed,
};

export const CATEGORY_ICON_STYLE: Record<string, string> = {
  Learning: "bg-[#2563EB]/10 text-[#2563EB]",
  Coding: "bg-[#8B5CF6]/10 text-[#8B5CF6]",
  Fitness: "bg-[#10B981]/10 text-[#10B981]",
  Reading: "bg-[#F59E0B]/10 text-[#F59E0B]",
  Meditation: "bg-[#06B6D4]/10 text-[#06B6D4]",
  Health: "bg-[#F43F5E]/10 text-[#F43F5E]",
  Productivity: "bg-[#6366F1]/10 text-[#6366F1]",
  Finance: "bg-[#10B981]/10 text-[#10B981]",
  Language: "bg-[#8B5CF6]/10 text-[#8B5CF6]",
  Custom: "bg-[#64748B]/10 text-[#64748B]",
  Uncategorized: "bg-[#64748B]/10 text-[#64748B]",
};

export const CATEGORY_CHIP: Record<string, string> = {
  Learning: "bg-[#2563EB]/10 text-[#2563EB]",
  Coding: "bg-[#8B5CF6]/10 text-[#8B5CF6]",
  Fitness: "bg-[#10B981]/10 text-[#10B981]",
  Reading: "bg-[#F59E0B]/10 text-[#F59E0B]",
  Meditation: "bg-[#06B6D4]/10 text-[#06B6D4]",
  Health: "bg-[#F43F5E]/10 text-[#F43F5E]",
  Productivity: "bg-[#6366F1]/10 text-[#6366F1]",
  Finance: "bg-[#10B981]/10 text-[#10B981]",
  Language: "bg-[#8B5CF6]/10 text-[#8B5CF6]",
  Custom: "bg-[#64748B]/10 text-[#64748B]",
  Uncategorized: "bg-[#64748B]/10 text-[#64748B]",
};

export const DIFFICULTY_CHIP: Record<HabitDifficulty, string> = {
  Easy: "bg-[#10B981]/10 text-[#10B981]",
  Medium: "bg-[#F59E0B]/10 text-[#F59E0B]",
  Hard: "bg-[#F43F5E]/10 text-[#F43F5E]",
};

export function CategoryIcon({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const Icon = CATEGORY_ICONS[category] ?? Sparkles;
  return <Icon className={className} />;
}
