"use client";

import { cn } from "@/lib/cn";

interface EmojiSelectorProps {
  value: string;
  onChange: (v: string) => void;
  options: { emoji: string; label: string }[];
  columns?: 3 | 4 | 5;
  label?: string;
  className?: string;
}

export default function EmojiSelector({
  value,
  onChange,
  options,
  columns = 4,
  label,
  className,
}: EmojiSelectorProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <span className="text-sm font-medium text-slate-700">{label}</span>
      )}
      <div
        className={cn(
          "grid gap-2",
          columns === 3 && "grid-cols-3",
          columns === 4 && "grid-cols-4",
          columns === 5 && "grid-cols-5"
        )}
      >
        {options.map(({ emoji, label: emojiLabel }) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border-2 p-2.5 transition-all duration-150",
              value === emoji
                ? "border-[#2563EB] bg-[#2563EB]/5 shadow-sm"
                : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
            )}
            aria-label={emojiLabel}
            aria-pressed={value === emoji}
          >
            <span className="text-xl leading-none">{emoji}</span>
            <span className="text-[10px] font-medium text-slate-500 leading-none">
              {emojiLabel}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
