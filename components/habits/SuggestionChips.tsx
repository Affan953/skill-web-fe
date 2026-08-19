"use client";

import { cn } from "@/lib/cn";

export interface SuggestionChipItem {
  key: string;
  label: string;
}

interface SuggestionChipsProps {
  items: SuggestionChipItem[];
  onPick: (item: SuggestionChipItem) => void;
  selectedKey?: string;
  className?: string;
}

export default function SuggestionChips({
  items,
  onPick,
  selectedKey,
  className,
}: SuggestionChipsProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="group">
      {items.map((item) => {
        const selected = item.key === selectedKey;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onPick(item)}
            aria-pressed={selected}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30",
              selected
                ? "border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB] shadow-sm shadow-[#2563EB]/10"
                : "border-slate-200 bg-white text-[#64748B] hover:border-[#2563EB]/40 hover:bg-[#2563EB]/5 hover:text-[#2563EB] active:scale-95"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
