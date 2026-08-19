"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

interface StarRatingProps {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  showValue?: boolean;
  className?: string;
}

const SIZES = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

export default function StarRating({
  value,
  onChange,
  max = 5,
  size = "md",
  label,
  showValue = false,
  className,
}: StarRatingProps) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {label && (
        <span className="text-sm font-medium text-slate-700">{label}</span>
      )}
      <div className="flex gap-0.5" role="radiogroup" aria-label={label || "Rating"}>
        {stars.map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={i === value}
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
            onClick={() => onChange(i)}
            className={cn(
              "transition-all duration-150 hover:scale-110",
              i <= value
                ? "text-amber-400 drop-shadow-sm"
                : "text-slate-200 hover:text-amber-200"
            )}
          >
            <Star
              className={SIZES[size]}
              fill={i <= value ? "currentColor" : "none"}
              strokeWidth={i <= value ? 0 : 1.5}
            />
          </button>
        ))}
      </div>
      {showValue && (
        <span className="text-xs font-medium text-slate-500">
          {value}/{max}
        </span>
      )}
    </div>
  );
}
