"use client";

import { cn } from "@/lib/cn";

interface SegmentedControlProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  size?: "sm" | "md";
  className?: string;
}

export default function SegmentedControl({
  options,
  value,
  onChange,
  size = "md",
  className,
}: SegmentedControlProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1",
        className
      )}
      role="radiogroup"
    >
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          role="radio"
          aria-checked={value === opt}
          onClick={() => onChange(opt)}
          className={cn(
            "rounded-lg font-medium transition-all duration-150",
            size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs",
            value === opt
              ? "bg-[#2563EB] text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
