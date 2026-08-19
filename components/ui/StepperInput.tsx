"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

interface StepperInputProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  className?: string;
}

export default function StepperInput({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  label,
  unit,
  className,
}: StepperInputProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {label && (
        <span className="text-sm font-medium text-slate-700">{label}</span>
      )}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="Decrease"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="min-w-[3ch] text-center text-sm font-semibold text-slate-900 tabular-nums">
          {value}{unit && <span className="text-xs font-normal text-slate-500 ml-0.5">{unit}</span>}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="Increase"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
