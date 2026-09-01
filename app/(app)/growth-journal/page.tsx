"use client";

import { useReflections } from "@/hooks/useReflections";
import {
  BookOpen, Flame, Zap, TrendingUp, Loader2, AlertTriangle,
  Star, Clock, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { CategoryGlyph } from "@/lib/iconMapper";
import type { Reflection } from "@/types";

const CATEGORY_COLORS: Record<string, string> = {
  Learning: "bg-[#2563EB]/10 text-[#2563EB]", Fitness: "bg-[#10B981]/10 text-[#10B981]",
  Reading: "bg-[#2563EB]/10 text-[#2563EB]", Meditation: "bg-purple-500/10 text-purple-500",
  Coding: "bg-[#2563EB]/10 text-[#2563EB]", Health: "bg-[#10B981]/10 text-[#10B981]",
  Productivity: "bg-amber-500/10 text-amber-500", Finance: "bg-[#10B981]/10 text-[#10B981]",
  Language: "bg-pink-500/10 text-pink-500", Custom: "bg-slate-100 text-slate-500",
};

function TimelineEntry({ reflection }: { reflection: Reflection }) {
  const date = new Date(reflection.createdAt);
  const proofEntries = reflection.proofOfProgress
    ? Object.entries(reflection.proofOfProgress).filter(([_, v]) => v !== "" && v !== 0 && v !== false && v !== null && v !== undefined)
    : [];

  return (
    <div className="relative flex gap-4 pb-8 last:pb-0">
      <div className="flex flex-col items-center">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl",
          CATEGORY_COLORS[reflection.category] ?? "bg-slate-100 text-slate-500")}>
          <CategoryGlyph category={reflection.category} className="h-5 w-5" />
        </div>
        <div className="mt-2 h-full w-px bg-slate-200" />
      </div>
      <div className="flex-1 rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">{reflection.title}</h4>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium",
                CATEGORY_COLORS[reflection.category] ?? "bg-slate-100 text-slate-500")}>
                {reflection.category}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="h-3 w-3" />
                {date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </span>
              {reflection.sessionMetadata?.durationMinutes && (
                <span className="text-[11px] text-slate-400">
                  {reflection.sessionMetadata.durationMinutes} min session
                </span>
              )}
            </div>
          </div>
          <span className="flex items-center gap-1 text-xs font-bold text-[#10B981]">
            <Zap className="h-3 w-3" />+{reflection.xpEarned}
          </span>
        </div>

        {proofEntries.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {proofEntries.slice(0, 6).map(([key, val]) => (
              <span key={key} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] text-slate-600">
                {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}: {
                  typeof val === "boolean" ? (val ? "Yes" : "No") :
                  typeof val === "object" ? JSON.stringify(val) : String(val)
                }
              </span>
            ))}
          </div>
        )}

        {reflection.reflection && (
          <p className="mb-3 text-sm leading-relaxed text-slate-600 italic">&quot;{reflection.reflection}&quot;</p>
        )}

        <div className="flex items-center gap-4 border-t border-slate-100 pt-3">
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <Flame className="h-3 w-3" /> Streak: {reflection.streakAfter}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <Star className="h-3 w-3" /> Level: {reflection.levelAfter}
          </span>
          <span className="text-[11px] text-slate-400" suppressHydrationWarning>
            {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
      </div>
    </div>
  );
}

function JournalContent() {
  const { reflections, summary, isLoading, isError, error } = useReflections();

  const statCards = [
    { label: "Total Reflections", value: summary?.totalReflections ?? 0, icon: <BookOpen className="h-5 w-5" />, color: "text-[#2563EB]", bg: "bg-[#2563EB]/10" },
    { label: "This Week", value: summary?.weeklyReflections ?? 0, icon: <TrendingUp className="h-5 w-5" />, color: "text-[#10B981]", bg: "bg-[#10B981]/10" },
    { label: "Weekly XP", value: summary?.weeklyXpFromReflections ?? 0, icon: <Zap className="h-5 w-5" />, color: "text-[#10B981]", bg: "bg-[#10B981]/10" },
    { label: "Avg Length", value: summary?.averageReflectionLength ?? 0, icon: <BarChart3 className="h-5 w-5" />, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  return (
    <div className="flex-1 px-4 py-8 sm:px-6">
      <section className="mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Growth Journal</h1>
          <p className="mt-1 text-sm text-slate-500">Your journey timeline and insights</p>
        </div>
      </section>

          <section className="mb-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {statCards.map((card) => (
                <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", card.bg, card.color)}>{card.icon}</div>
                    <div>
                      <p className="text-[11px] text-slate-500">{card.label}</p>
                      <p className="text-lg font-bold text-slate-900">{card.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {summary?.categoriesExplored && summary.categoriesExplored.length > 0 && (
            <section className="mb-6">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Categories Explored This Week</h2>
              <div className="flex flex-wrap gap-2">
                {summary.categoriesExplored.map((cat) => (
                  <span key={cat} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", CATEGORY_COLORS[cat] ?? "bg-slate-100 text-slate-500")}>
                    <CategoryGlyph category={cat} className="h-3.5 w-3.5" /> {cat}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-white py-16 text-center">
                <AlertTriangle className="mb-3 h-6 w-6 text-red-400" />
                <p className="text-sm font-medium text-red-400">Failed to load reflections</p>
                <p className="mt-1 text-xs text-slate-500">{error?.message || "Please try again later."}</p>
              </div>
            ) : reflections.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50">
                  <BookOpen className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-500">No journeys yet</p>
                <p className="mt-1 text-xs text-slate-400">Complete a habit to start your growth journey!</p>
              </div>
            ) : (
              <div className="max-w-2xl">
                {reflections.map((r) => (
                  <TimelineEntry key={r.id} reflection={r} />
                ))}
              </div>
            )}
          </section>
    </div>
  );
}

export default function GrowthJournalPage() {
  return <JournalContent />;
}
