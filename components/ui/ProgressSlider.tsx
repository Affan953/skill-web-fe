"use client";

import { cn } from "@/lib/cn";

interface ProgressSliderProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  leftLabel?: string;
  rightLabel?: string;
  className?: string;
}

export default function ProgressSlider({
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  label,
  showValue = true,
  leftLabel,
  rightLabel,
  className,
}: ProgressSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-sm font-medium text-slate-700">{label}</span>
          )}
          {showValue && (
            <span className="min-w-[3ch] text-center text-sm font-bold text-[#2563EB] tabular-nums">
              {value}
            </span>
          )}
        </div>
      )}
      <div className="flex items-center gap-3">
        {leftLabel && (
          <span className="text-[10px] font-medium text-slate-400 w-8 text-right">
            {leftLabel}
          </span>
        )}
        <div className="relative flex-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#10B981] transition-all duration-150"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="absolute inset-0 h-2 w-full cursor-pointer opacity-0"
            aria-label={label}
          />
          <div
            className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#2563EB] bg-white shadow-md transition-all duration-150"
            style={{ left: `${percentage}%` }}
          />
        </div>
        {rightLabel && (
          <span className="text-[10px] font-medium text-slate-400 w-8">
            {rightLabel}
          </span>
        )}
      </div>
    </div>
  );
}
