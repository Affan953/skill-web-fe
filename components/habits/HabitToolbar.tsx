"use client";

import { ArrowUpDown, Search } from "lucide-react";
import type { HabitCategory, HabitDifficulty } from "@/types";
import { CATEGORY_OPTIONS } from "@/components/habits/habitUi";
import { cn } from "@/lib/cn";

export type SortOption = "newest" | "oldest" | "xp" | "alpha";

export const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  oldest: "Oldest",
  xp: "Highest XP",
  alpha: "A-Z",
};

const DIFFICULTIES: HabitDifficulty[] = ["Easy", "Medium", "Hard"];

interface HabitToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterCategory: HabitCategory | "All";
  onCategoryChange: (value: HabitCategory | "All") => void;
  filterDifficulty: HabitDifficulty | "All";
  onDifficultyChange: (value: HabitDifficulty | "All") => void;
  filterCompleted: "All" | "completed" | "pending";
  onCompletedChange: (value: "All" | "completed" | "pending") => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
}

function FilterSelect({
  value,
  onChange,
  children,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-medium text-[#64748B] shadow-sm transition-all duration-200 hover:border-[#2563EB]/40 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 focus:outline-none"
    >
      {children}
    </select>
  );
}

export default function HabitToolbar({
  search,
  onSearchChange,
  filterCategory,
  onCategoryChange,
  filterDifficulty,
  onDifficultyChange,
  filterCompleted,
  onCompletedChange,
  sortBy,
  onSortChange,
}: HabitToolbarProps) {
  return (
    <section className="mb-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search habits..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-[#0F172A] shadow-sm placeholder:text-[#94A3B8] transition-all duration-200 hover:border-[#2563EB]/40 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <FilterSelect
            value={filterCategory}
            onChange={(v) => onCategoryChange(v as HabitCategory | "All")}
            ariaLabel="Filter by category"
          >
            <option value="All">All Categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            value={filterDifficulty}
            onChange={(v) => onDifficultyChange(v as HabitDifficulty | "All")}
            ariaLabel="Filter by difficulty"
          >
            <option value="All">All Difficulties</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            value={filterCompleted}
            onChange={(v) =>
              onCompletedChange(v as "All" | "completed" | "pending")
            }
            ariaLabel="Filter by status"
          >
            <option value="All">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </FilterSelect>
          <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm transition-all duration-200 hover:border-[#2563EB]/40 focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/10">
            <ArrowUpDown
              className={cn("h-3.5 w-3.5 text-[#94A3B8]")}
            />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              aria-label="Sort habits"
              className="bg-transparent text-xs font-medium text-[#64748B] focus:outline-none"
            >
              {Object.entries(SORT_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}
