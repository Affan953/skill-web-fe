"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Zap, Flame, Star, Trophy, ArrowRight, Clock, Shield, Sparkles, Target } from "lucide-react";
import type { Reflection, Habit } from "@/types";
import { cn } from "@/lib/cn";
import {
  DEFAULT_NOTIFICATION_ICON,
  NOTIFICATION_CATEGORY_ICONS,
  NOTIFICATION_TYPE_ICONS,
} from "@/lib/systemNotification";
import { formatGoal } from "@/lib/habitGoal";

interface GrowthSummaryProps {
  habit: Habit;
  reflection: Reflection;
  onClose: () => void;
}

export default function GrowthSummary({ habit, reflection, onClose }: GrowthSummaryProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  const proofEntries = reflection.proofOfProgress
    ? Object.entries(reflection.proofOfProgress).filter(([, v]) => v !== "" && v !== 0 && v !== false && v !== null)
    : [];

  const formatKey = (key: string) => key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatValue = (val: any) => {
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (typeof val === "object" && val !== null) {
      if (Array.isArray(val)) return val.join(", ");
      return Object.entries(val).map(([k, v]) => `${k}: ${v}`).join(", ");
    }
    return String(val);
  };

  const CategoryIcon =
    NOTIFICATION_CATEGORY_ICONS[habit.category.toLowerCase()] ||
    NOTIFICATION_TYPE_ICONS.JOURNEY_RECORDED ||
    DEFAULT_NOTIFICATION_ICON;

  const reveal = () =>
    cn(
      "transition-all duration-500",
      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
    ) as string;

  const stats = [
    { icon: <Star className="h-3.5 w-3.5" />, value: `Lvl ${reflection.levelAfter}`, label: "Class", color: "text-[#2563EB]", chip: "bg-[#2563EB]/10" },
    { icon: <Flame className="h-3.5 w-3.5" />, value: `${reflection.streakAfter}d`, label: "Streak", color: "text-[#F59E0B]", chip: "bg-[#F59E0B]/10" },
    { icon: <Shield className="h-3.5 w-3.5" />, value: "+1", label: "Completed", color: "text-[#6366F1]", chip: "bg-[#6366F1]/10" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div
        className={cn(
          "w-full max-w-[460px] my-auto transition-all duration-500 transform",
          visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-[0.97] translate-y-4"
        )}
      >
        <div
          className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/95 text-slate-900"
          style={{
            boxShadow: "0 0 0 1px rgba(37,99,235,0.1), 0 0 40px rgba(37,99,235,0.1), 0 30px 80px rgba(0,0,0,0.25)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          {/* Top accent line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2563EB]/50 to-transparent" />
          {/* Decorative glows */}
          <div className="pointer-events-none absolute -top-20 -right-16 h-44 w-44 rounded-full bg-[#2563EB]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-44 w-44 rounded-full bg-[#10B981]/10 blur-3xl" />

          {/* Header */}
          <div className="relative px-6 pt-5 pb-4">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] shadow-lg shadow-[#2563EB]/25">
                  <Trophy className="h-4 w-4 text-white" />
                  <div className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#10B981] border-2 border-white">
                    <CheckCircle2 className="h-2 w-2 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-[#0F172A] uppercase">Growth Summary</h2>
                  <p className="text-[9px] font-semibold text-[#2563EB] tracking-wider uppercase">Session completed successfully</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#10B981]/15 to-[#10B981]/5 border border-[#10B981]/25 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#10B981]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                </span>
                Verified
              </div>
            </div>

            {/* Mission info */}
            <div className={cn(reveal(), "relative flex items-center gap-3 rounded-2xl border border-[#2563EB]/10 bg-gradient-to-r from-[#2563EB]/[0.06] to-transparent p-3")}>
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white border border-[#2563EB]/15 text-[#2563EB] shadow-sm">
                <CategoryIcon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-semibold text-[#2563EB] uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" />
                  Selected Objective
                </p>
                <p className="text-xs font-bold text-[#0F172A] truncate mt-0.5">{habit.title}</p>
              </div>
              <span className="rounded-full bg-white border border-[#2563EB]/20 px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#2563EB] shadow-sm">
                {habit.category}
              </span>
            </div>
          </div>

          <div className="relative mx-6 h-px bg-slate-100" />

          {/* Proof & Reflection */}
          <div className={cn(reveal(), "relative px-6 py-3.5 space-y-3.5 max-h-[38vh] overflow-y-auto scrollbar-thin")}>
            {/* Session summary */}
            <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-2 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#2563EB]/10">
                    <Target className="h-3 w-3 text-[#2563EB]" />
                  </span>
                  Target
                </span>
                <span className="text-[10px] font-bold text-[#2563EB] tabular-nums">
                  {formatGoal(habit).value || "—"}
                </span>
              </div>
              {reflection.sessionMetadata?.durationMinutes && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#2563EB]/10">
                      <Clock className="h-3 w-3 text-[#2563EB]" />
                    </span>
                    Session Duration
                  </span>
                  <span className="text-[10px] font-bold text-[#0F172A] tabular-nums">
                    {reflection.sessionMetadata.durationMinutes} min
                  </span>
                </div>
              )}
            </div>

            {/* Proof of progress */}
            {proofEntries.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <h4 className="text-[8px] font-bold tracking-[0.15em] uppercase text-[#2563EB]">Proof of Progress</h4>
                  <div className="flex-1 h-px bg-gradient-to-r from-[#2563EB]/20 to-transparent" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {proofEntries.map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-1.5 shadow-sm">
                      <span className="flex items-center gap-1.5 text-[10px] text-[#64748B] min-w-0">
                        <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-[#10B981]" />
                        <span className="truncate">{formatKey(key)}</span>
                      </span>
                      <span className="text-[10px] font-semibold text-[#0F172A] truncate max-w-[100px]">{formatValue(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reflection */}
            {reflection.reflection && (
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <h4 className="text-[8px] font-bold tracking-[0.15em] uppercase text-[#2563EB]">Reflection Journal</h4>
                  <div className="flex-1 h-px bg-gradient-to-r from-[#2563EB]/20 to-transparent" />
                </div>
                <div className="relative overflow-hidden rounded-xl border border-[#2563EB]/10 bg-gradient-to-br from-[#2563EB]/[0.05] to-[#2563EB]/[0.01] p-3">
                  <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-[#2563EB] to-[#6366F1]" />
                  <div className="absolute -bottom-4 -right-4 h-14 w-14 rounded-full bg-[#2563EB]/5 blur-xl" />
                  <p className="relative text-[10px] leading-relaxed text-[#475569] italic font-medium pl-2.5">&quot;{reflection.reflection}&quot;</p>
                </div>
              </div>
            )}
          </div>

          <div className="relative mx-6 h-px bg-slate-100" />

          {/* Stats */}
          <div className={cn(reveal(), "relative px-6 py-3.5")}>
            {/* XP hero */}
            <div className="mb-2.5 flex items-center justify-between rounded-2xl border border-[#10B981]/20 bg-gradient-to-r from-[#10B981]/15 via-[#10B981]/5 to-transparent p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] shadow-lg shadow-[#10B981]/25">
                  <Zap className="h-4 w-4 text-white" fill="currentColor" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#10B981]">XP Earned</p>
                  <p className="text-lg font-black text-[#059669] tabular-nums leading-none mt-0.5">+{reflection.xpEarned}</p>
                </div>
              </div>
              <div className="text-right pr-1">
                <p className="text-[8px] font-bold uppercase tracking-widest text-[#94A3B8]">Mission</p>
                <p className="text-[11px] font-bold text-[#0F172A]">Completed</p>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-1.5">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-slate-100 bg-white p-2 text-center shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                  <div className={cn("mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full", stat.chip, stat.color)}>
                    {stat.icon}
                  </div>
                  <p className="text-[10px] font-bold text-[#0F172A] tabular-nums">{stat.value}</p>
                  <p className="text-[7px] font-semibold text-[#94A3B8] uppercase tracking-widest mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-6 h-px bg-slate-100" />

          {/* Footer */}
          <div className={cn(reveal(), "relative px-6 py-4")}>
            <button
              onClick={onClose}
              className="group relative h-11 w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#3B82F6] hover:to-[#2563EB] text-[10px] font-bold uppercase tracking-widest text-white transition-all duration-200 hover:shadow-lg hover:shadow-[#2563EB]/25 flex items-center justify-center"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative flex items-center justify-center gap-2">
                Confirm Summary
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
