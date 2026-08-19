"use client";

import { useState, useEffect } from "react";
import { X, Play, Zap, Flame, BookOpen, Code, Dumbbell, BookText, Brain, Heart, Briefcase, Wallet, Smile, Target } from "lucide-react";
import type { Habit } from "@/types";
import { cn } from "@/lib/cn";
import { formatGoal } from "@/lib/habitGoal";
import { getMotivationalMessage } from "@/lib/sessionContext";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Language: BookOpen,
  Coding: Code,
  Fitness: Dumbbell,
  Reading: BookText,
  Meditation: Brain,
  Health: Heart,
  Productivity: Briefcase,
  Finance: Wallet,
  Learning: BookOpen,
  Custom: Smile,
};



interface StartSessionModalProps {
  open: boolean;
  habit: Habit | null;
  onStart: () => void;
  onCancel: () => void;
}

export default function StartSessionModal({ open, habit, onStart, onCancel }: StartSessionModalProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => {
        setMounted(true);
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(raf);
    }
    const hide = setTimeout(() => setVisible(false), 0);
    const unmount = setTimeout(() => setMounted(false), 300);
    return () => {
      clearTimeout(hide);
      clearTimeout(unmount);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onCancel]);

  if (!mounted || !habit) return null;

  const Icon = CATEGORY_ICONS[habit.category] ?? BookOpen;
  const quote = getMotivationalMessage(habit.category, habit.title);
  const { label: goalLabel, value: goalValue } = formatGoal(habit);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300",
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Start Session"
    >
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onCancel} />

      <div
        className={cn(
          "relative w-full max-w-[720px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white transition-all duration-300",
          visible ? "scale-100 opacity-100 translate-y-0" : "scale-[0.97] opacity-0 translate-y-3"
        )}
        style={{ boxShadow: "0 0 0 1px rgba(37,99,235,0.04), 0 8px 40px rgba(37,99,235,0.06), 0 20px 60px rgba(0,0,0,0.06)" }}
      >
        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-6">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-[#2563EB]/8 text-[#2563EB]">
              <Icon className="h-8 w-8" />
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#2563EB] mb-1">Mission Briefing</p>
              <h2 className="text-2xl font-bold text-[#0F172A] leading-tight">{habit.title}</h2>
              {habit.activity && habit.activity !== habit.title && (
                <p className="mt-1 text-sm text-[#64748B]">{habit.activity}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-[#2563EB]/8 px-3 py-1 text-xs font-medium text-[#2563EB]">{habit.category}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  <Zap className="h-3 w-3" />{habit.difficulty}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#10B981]/8 px-3 py-1 text-xs font-medium text-[#10B981]">
                  <Flame className="h-3 w-3" />{habit.xpReward} XP
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-8 h-px bg-slate-100" />

        {/* Body */}
        <div className="px-8 py-6 space-y-5">
          {/* Quote */}
          <div className="rounded-2xl bg-[#F8FAFC] border border-slate-100 p-5 text-center">
            <p className="text-sm italic leading-relaxed text-[#64748B]">&quot;{quote}&quot;</p>
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB]/8">
                  <Target className="h-5 w-5 text-[#2563EB]" />
                </div>
                <span className="text-xs font-medium text-[#64748B]">{goalLabel}</span>
              </div>
              <p className="text-2xl font-bold text-[#0F172A] tabular-nums">{goalValue || "—"}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10B981]/8">
                  <Zap className="h-5 w-5 text-[#10B981]" />
                </div>
                <span className="text-xs font-medium text-[#64748B]">Experience Reward</span>
              </div>
              <p className="text-2xl font-bold text-[#10B981] tabular-nums">{habit.xpReward}<span className="text-sm font-normal text-[#94A3B8] ml-1">XP</span></p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-8 h-px bg-slate-100" />

        {/* Footer */}
        <div className="px-8 py-6 flex gap-4">
          <button
            onClick={onCancel}
            className="h-14 flex-1 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-[#64748B] transition-all duration-200 hover:bg-slate-50 hover:border-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={onStart}
            className="group h-14 flex-1 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-[#2563EB]/25 hover:-translate-y-0.5 flex items-center justify-center gap-2.5"
          >
            <Play className="h-4 w-4" />
            Start Session
          </button>
        </div>
      </div>
    </div>
  );
}
