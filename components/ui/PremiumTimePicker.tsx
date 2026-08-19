"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { Clock } from "lucide-react";

interface PremiumTimePickerProps {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  label?: string;
  className?: string;
}

export default function PremiumTimePicker({
  value,
  onChange,
  max = 180,
  label,
  className,
}: PremiumTimePickerProps) {
  const [minutes, setMinutes] = useState(Math.floor(value / 60));
  const [seconds, setSeconds] = useState(value % 60);

  useEffect(() => {
    const total = minutes * 60 + seconds;
    onChange(Math.min(total, max * 60));
  }, [minutes, seconds, max, onChange]);

  const displayMinutes = Math.floor(value / 60);
  const displaySeconds = value % 60;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#2563EB]" />
          <span className="text-sm font-medium text-slate-700">{label}</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={Math.floor(max / 60)}
            value={displayMinutes}
            onChange={(e) => {
              const m = parseInt(e.target.value) || 0;
              onChange(Math.min(m * 60 + displaySeconds, max * 60));
            }}
            className="w-16 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-lg font-bold text-slate-900 focus:border-[#2563EB] focus:outline-none tabular-nums"
            aria-label="Minutes"
          />
          <span className="text-lg font-bold text-slate-400">:</span>
          <input
            type="number"
            min={0}
            max={59}
            value={String(displaySeconds).padStart(2, "0")}
            onChange={(e) => {
              const s = parseInt(e.target.value) || 0;
              onChange(Math.min(displayMinutes * 60 + Math.min(s, 59), max * 60));
            }}
            className="w-16 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-lg font-bold text-slate-900 focus:border-[#2563EB] focus:outline-none tabular-nums"
            aria-label="Seconds"
          />
        </div>
        <span className="text-xs text-slate-400">min:sec</span>
      </div>
    </div>
  );
}
