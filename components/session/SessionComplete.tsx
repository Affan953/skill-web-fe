"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, ArrowRight, Sparkles, Clock, Zap, Target } from "lucide-react";
import type { Habit } from "@/types";
import { cn } from "@/lib/cn";
import { formatGoal, isTimedSession } from "@/lib/habitGoal";

interface SessionCompleteProps {
  habit: Habit;
  durationMinutes: number;
  onContinue: () => void;
}

export default function SessionComplete({ habit, durationMinutes, onContinue }: SessionCompleteProps) {
  const [visible, setVisible] = useState(false);

  const timed = isTimedSession(habit);
  const { value: goalValue } = formatGoal(habit);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(15,23,42,0.6)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
      <div
        className={cn(
          "w-full max-w-[720px] overflow-hidden rounded-3xl border border-white/20 bg-white/95 transition-all duration-500",
          visible ? "scale-100 opacity-100 translate-y-0" : "scale-[0.97] opacity-0 translate-y-3"
        )}
        style={{ boxShadow: "0 0 0 1px rgba(37,99,235,0.08), 0 8px 40px rgba(37,99,235,0.12), 0 30px 80px rgba(0,0,0,0.25)" }}
      >
        {/* Header */}
        <div className="px-8 pt-10 pb-6 text-center">
          {/* Success icon */}
          <div className="mb-5 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#10B981]/10">
              <CheckCircle2 className="h-10 w-10 text-[#10B981]" />
            </div>
          </div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#10B981]/8 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#10B981]" />
            <span className="text-xs font-semibold text-[#10B981]">Session Complete</span>
          </div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Great work!</h2>
          <p className="mt-2 text-sm text-[#64748B]">
            <>
              You completed{" "}
              <span className="font-semibold text-[#0F172A]">{habit.title}</span>.
              {timed ? (
                <> Session duration: <span className="font-semibold text-[#0F172A]">{durationMinutes} minutes</span>.</>
              ) : (
                <> Target: <span className="font-semibold text-[#0F172A]">{goalValue || "met"}</span>.</>
              )}
            </>
          </p>
        </div>

        <div className="mx-8 h-px bg-slate-100" />

        {/* Stats */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 text-center">
              <Clock className="mx-auto mb-2 h-5 w-5 text-[#2563EB]" />
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#94A3B8]">Target</p>
              <p className="mt-1 text-xl font-bold text-[#0F172A] tabular-nums">{goalValue || "—"}</p>
              {timed && (
                <p className="mt-0.5 text-[10px] text-[#94A3B8]">Session: {durationMinutes} min</p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 text-center">
              <Target className="mx-auto mb-2 h-5 w-5 text-[#2563EB]" />
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#94A3B8]">Category</p>
              <p className="mt-1 text-xl font-bold text-[#0F172A]">{habit.category}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 text-center">
              <Zap className="mx-auto mb-2 h-5 w-5 text-[#10B981]" />
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#94A3B8]">XP Earned</p>
              <p className="mt-1 text-xl font-bold text-[#10B981] tabular-nums">+{habit.xpReward}</p>
            </div>
          </div>
        </div>

        <div className="mx-8 h-px bg-slate-100" />

        {/* Footer */}
        <div className="px-8 py-6 text-center">
          <p className="mb-4 text-xs text-[#94A3B8]">Now let&apos;s record today&apos;s progress.</p>
          <button
            onClick={onContinue}
            className="group h-14 w-full rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-[#2563EB]/25 hover:-translate-y-0.5 flex items-center justify-center gap-2.5"
          >
            Continue to Verification
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
