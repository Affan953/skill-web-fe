"use client";

import { useState } from "react";
import SystemWindow from "@/components/system/SystemWindow";
import ProofOfProgressForm from "@/components/proof-of-progress/ProofOfProgressForm";
import type { Habit } from "@/types";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  Clock,
  Target,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { getProofPrompt } from "@/lib/sessionContext";
import { formatGoal } from "@/lib/habitGoal";

interface ProofOfProgressModalProps {
  open: boolean;
  habit: Habit | null;
  durationMinutes: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onComplete: (data: Record<string, any>) => void;
  onBack: () => void;
}

export default function ProofOfProgressModal({
  open, habit, durationMinutes, initialData, onComplete, onBack,
}: ProofOfProgressModalProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<Record<string, any>>(initialData);

  if (!habit) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (newData: Record<string, any>) => setData(newData);
  const handleSubmit = () => onComplete(data);

  return (
    <SystemWindow open={open} onClose={onBack} title="" subtitle="" maxWidth="max-w-2xl">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] shadow-lg shadow-[#2563EB]/25">
              <ClipboardCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Mission Report</h2>
              <p className="text-xs text-[#94A3B8]">Document your progress</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="rounded-full bg-[#2563EB]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#2563EB]">
              Step 2 of 4
            </span>
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 w-6 rounded-full transition-colors",
                    i <= 1 ? "bg-[#2563EB]" : "bg-slate-200"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Session info */}
        <div className="grid grid-cols-3 gap-3">
          <div className="min-w-0 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              <Target className="h-3.5 w-3.5" />
              Activity
            </div>
            <p className="mt-1 truncate text-sm font-semibold text-[#0F172A]">{habit.activity || habit.title}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              <Target className="h-3.5 w-3.5" />
              Target
            </div>
            <p className="mt-1 text-sm font-bold text-[#2563EB] tabular-nums">
              {formatGoal(habit).value || "—"}
            </p>
          </div>
          <div className="min-w-0 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              <Clock className="h-3.5 w-3.5" />
              Session
            </div>
            <p className="mt-1 text-sm font-bold text-[#0F172A] tabular-nums">
              {durationMinutes}
              <span className="ml-0.5 text-xs font-normal text-[#94A3B8]">min</span>
            </p>
          </div>
        </div>

        {/* Form area — glass blur */}
        <div
          className="rounded-2xl border border-white/60 p-4"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.4) 100%)",
            backdropFilter: "blur(16px) saturate(180%)",
            WebkitBackdropFilter: "blur(16px) saturate(180%)",
            boxShadow: "0 0 0 1px rgba(37,99,235,0.06), inset 0 1px 0 rgba(255,255,255,0.5)",
          }}
        >
          <div className="mb-4 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
            <Zap className="h-3.5 w-3.5 text-[#2563EB]" />
            {getProofPrompt(habit.category, habit.activity)}
          </div>

          <ProofOfProgressForm category={habit.category} activity={habit.activity ?? undefined} value={data} onChange={handleChange} />

          {/* Confidence */}
          <div className="mt-5 border-t border-slate-200/60 pt-4">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Confidence</span>
              <span className="text-[11px] text-slate-400">How did it go?</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setData({ ...data, confidence: i })}
                  aria-pressed={(data.confidence || 0) >= i}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all duration-200",
                    (data.confidence || 0) >= i
                      ? "scale-105 bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white shadow-md shadow-[#2563EB]/25"
                      : "border border-slate-200 bg-white/80 text-[#94A3B8] hover:border-[#2563EB]/30 hover:bg-white hover:text-[#64748B]"
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-[#64748B] transition-all duration-200 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            onClick={handleSubmit}
            className="group flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-sm font-semibold text-white shadow-lg shadow-[#2563EB]/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#2563EB]/30"
          >
            Submit Report
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </SystemWindow>
  );
}
