"use client";

import { useState } from "react";
import { useReflections } from "@/hooks/useReflections";
import {
  Calendar, TrendingUp, Flame, Zap, Star, Trophy,
  BarChart3, Loader2, AlertTriangle, Target, BookOpen, Clock,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { WeeklyReview, MonthlyReview } from "@/types";

const CATEGORY_COLORS: Record<string, string> = {
  Learning: "bg-[#2563EB]", Fitness: "bg-[#10B981]", Reading: "bg-[#2563EB]",
  Meditation: "bg-purple-500", Coding: "bg-[#2563EB]", Health: "bg-[#10B981]",
  Productivity: "bg-amber-500", Finance: "bg-[#10B981]", Language: "bg-pink-500", Custom: "bg-slate-400",
};

function WeeklyReviewCard({ review }: { review: WeeklyReview }) {
  const maxXP = Math.max(...review.dailyBreakdown.map((d) => d.xp), 1);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-[#2563EB]" />
        <h3 className="text-lg font-bold text-slate-900">Weekly Review</h3>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-[#2563EB]/5 p-3 text-center">
          <p className="text-2xl font-bold text-[#2563EB]">{review.habitsCompleted}</p>
          <p className="text-[10px] text-slate-500">Habits Done</p>
        </div>
        <div className="rounded-xl bg-[#10B981]/5 p-3 text-center">
          <p className="text-2xl font-bold text-[#10B981]">{review.xpEarned}</p>
          <p className="text-[10px] text-slate-500">XP Earned</p>
        </div>
        <div className="rounded-xl bg-purple-500/5 p-3 text-center">
          <p className="text-2xl font-bold text-purple-500">{review.reflectionCount}</p>
          <p className="text-[10px] text-slate-500">Reflections</p>
        </div>
        <div className="rounded-xl bg-orange-500/5 p-3 text-center">
          <p className="text-2xl font-bold text-orange-500">{review.longestStreak}</p>
          <p className="text-[10px] text-slate-500">Best Streak</p>
        </div>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] text-slate-400">Best Category</p>
          <p className="text-sm font-semibold text-slate-900">{review.bestCategory}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] text-slate-400">Most Active Day</p>
          <p className="text-sm font-semibold text-slate-900">{review.mostActiveDay}</p>
        </div>
      </div>
      <div className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Daily Activity</p>
        <div className="flex items-end gap-2">
          {review.dailyBreakdown.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t-md bg-[#2563EB]/20 transition-all" style={{ height: `${Math.max((d.completions / Math.max(...review.dailyBreakdown.map((x) => x.completions), 1)) * 60, 4)}px` }} />
              <span className="text-[10px] text-slate-400">{d.day}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl bg-gradient-to-r from-[#2563EB]/5 to-[#10B981]/5 p-4">
        <p className="text-xs font-semibold text-slate-500">Personal Insight</p>
        <p className="mt-1 text-sm italic text-slate-700">&quot;{review.personalInsight}&quot;</p>
      </div>
    </div>
  );
}

function MonthlyReviewCard({ review }: { review: MonthlyReview }) {
  const maxCatXp = Math.max(...review.categoryBreakdown.map((c) => c.xp), 1);
  const maxWeekXp = Math.max(...review.xpByWeek.map((w) => w.xp), 1);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-[#10B981]" />
        <h3 className="text-lg font-bold text-slate-900">{review.month} {review.year} Growth Report</h3>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-[#2563EB]/5 p-3 text-center">
          <p className="text-2xl font-bold text-[#2563EB]">{review.totalHabitsCompleted}</p>
          <p className="text-[10px] text-slate-500">Habits Done</p>
        </div>
        <div className="rounded-xl bg-[#10B981]/5 p-3 text-center">
          <p className="text-2xl font-bold text-[#10B981]">{review.totalXpEarned}</p>
          <p className="text-[10px] text-slate-500">Total XP</p>
        </div>
        <div className="rounded-xl bg-purple-500/5 p-3 text-center">
          <p className="text-2xl font-bold text-purple-500">{review.totalReflections}</p>
          <p className="text-[10px] text-slate-500">Reflections</p>
        </div>
        <div className="rounded-xl bg-amber-500/5 p-3 text-center">
          <p className="text-2xl font-bold text-amber-500">{review.consistencyScore}%</p>
          <p className="text-[10px] text-slate-500">Consistency</p>
        </div>
      </div>
      {review.categoryBreakdown.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Category Breakdown</p>
          <div className="space-y-2">
            {review.categoryBreakdown.map((cat) => (
              <div key={cat.category} className="flex items-center gap-3">
                <span className="w-24 text-xs text-slate-500">{cat.category}</span>
                <div className="flex-1">
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className={cn("h-full rounded-full transition-all", CATEGORY_COLORS[cat.category] ?? "bg-slate-400")}
                      style={{ width: `${(cat.xp / maxCatXp) * 100}%` }} />
                  </div>
                </div>
                <span className="w-12 text-right text-xs font-medium text-slate-700">{cat.xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {review.xpByWeek.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">XP by Week</p>
          <div className="flex items-end gap-2">
            {review.xpByWeek.map((w) => (
              <div key={w.week} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t-md bg-[#10B981]/30 transition-all"
                  style={{ height: `${Math.max((w.xp / maxWeekXp) * 60, 4)}px` }} />
                <span className="text-[10px] text-slate-400">{w.week}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="rounded-xl bg-gradient-to-r from-[#2563EB]/5 to-[#10B981]/5 p-4">
        <p className="text-xs font-semibold text-slate-500">Growth Summary</p>
        <p className="mt-1 text-sm text-slate-700">{review.growthSummary}</p>
      </div>
    </div>
  );
}

function ReviewsContent() {
  const [tab, setTab] = useState<"weekly" | "monthly">("weekly");
  const { weeklyReview, monthlyReview, isLoading, isError } = useReflections();

  return (
    <div className="flex-1 px-4 py-8 sm:px-6">
      <section className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Reviews</h1>
        <p className="mt-1 text-sm text-slate-500">Your weekly and monthly growth insights</p>
      </section>

          <section className="mb-6">
            <div className="flex gap-2 rounded-xl border border-slate-200 bg-white p-1">
              <button onClick={() => setTab("weekly")}
                className={cn("flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                  tab === "weekly" ? "bg-[#2563EB] text-white" : "text-slate-500 hover:text-slate-900")}>
                Weekly Review
              </button>
              <button onClick={() => setTab("monthly")}
                className={cn("flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                  tab === "monthly" ? "bg-[#2563EB] text-white" : "text-slate-500 hover:text-slate-900")}>
                Monthly Review
              </button>
            </div>
          </section>

          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" /></div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-white py-16 text-center">
              <AlertTriangle className="mb-3 h-6 w-6 text-red-400" />
              <p className="text-sm font-medium text-red-400">Failed to load reviews</p>
            </div>
          ) : tab === "weekly" ? (
            weeklyReview ? <WeeklyReviewCard review={weeklyReview} /> : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-center">
                <Calendar className="mb-3 h-6 w-6 text-slate-400" />
                <p className="text-sm font-medium text-slate-500">No weekly data yet</p>
                <p className="mt-1 text-xs text-slate-400">Complete some habits to see your weekly review!</p>
              </div>
            )
          ) : (
            monthlyReview ? <MonthlyReviewCard review={monthlyReview} /> : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-center">
                <BarChart3 className="mb-3 h-6 w-6 text-slate-400" />
                <p className="text-sm font-medium text-slate-500">No monthly data yet</p>
                <p className="mt-1 text-xs text-slate-400">Keep building habits to see your monthly report!</p>
              </div>
            )
          )}
    </div>
  );
}

export default function ReviewsPage() {
  return <ReviewsContent />;
}
