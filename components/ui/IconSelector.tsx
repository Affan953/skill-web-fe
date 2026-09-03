"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface IconSelectorOption {
  icon: LucideIcon;
  label: string;
}

interface IconSelectorProps {
  value: string;
  onChange: (v: string) => void;
  options: IconSelectorOption[];
  columns?: 3 | 4 | 5;
  label?: string;
  className?: string;
}

export default function IconSelector({
  value,
  onChange,
  options,
  columns = 4,
  label,
  className,
}: IconSelectorProps) {
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
        {options.map(({ icon: Icon, label: iconLabel }) => (
          <button
            key={iconLabel}
            type="button"
            onClick={() => onChange(iconLabel)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border-2 p-2.5 transition-all duration-150",
              value === iconLabel
                ? "border-[#2563EB] bg-[#2563EB]/5 shadow-sm"
                : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
            )}
            aria-label={iconLabel}
            aria-pressed={value === iconLabel}
          >
            <Icon className="h-5 w-5 text-[#2563EB]" />
            <span className="text-[10px] font-medium text-slate-500 leading-none">
              {iconLabel}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}