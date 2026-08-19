"use client";

import { cn } from "@/lib/cn";

interface AnimatedToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function AnimatedToggle({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}: AnimatedToggleProps) {
  return (
    <label
      className={cn(
        "flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 transition-colors",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:bg-slate-50",
        className
      )}
    >
      {label && (
        <span className="text-sm font-medium text-slate-700">{label}</span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          if (!disabled) onChange(!checked);
        }}
        className={cn(
          "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out",
          checked ? "bg-[#2563EB]" : "bg-slate-200"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
            checked ? "translate-x-5.5" : "translate-x-0.5",
            "mt-0.5"
          )}
        />
      </button>
    </label>
  );
}
