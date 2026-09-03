"use client";

import { useMemo } from "react";
import PlaceholderCard from "@/components/PlaceholderCard";
import { useAuth } from "@/contexts/AuthContext";
import { useUserQuery } from "@/hooks/useUserQuery";
import { useDashboard } from "@/hooks/useDashboard";
import { useReflections } from "@/hooks/useReflections";
import GrowthOverviewSection from "@/components/dashboard/GrowthOverviewSection";
import { formatGoal } from "@/lib/habitGoal";
import { levelSpan, xpIntoLevel, xpRemaining, levelPercent } from "@/lib/xp";
import Link from "next/link";
import {
  Zap,
  Star,
  TrendingUp,
  CheckCircle2,
  Flame,
  Trophy,
  RotateCcw,
  AlertCircle,
  Loader2,
  Play,
  ArrowRight,
  BookOpen,
  Target,
  Sparkles,
} from "lucide-react";

function LoadingSkeleton() {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
        <p className="text-sm text-slate-500">Loading dashboard...</p>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-red-200 bg-white p-8 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-sm text-red-500">{message}</p>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
        >
          <RotateCcw className="h-4 w-4" />
          Retry
        </button>
      </div>
    </div>
  );
}

function CircularProgress({ percent }: { percent: number }) {
  const radius = 54;
  const stroke = 8;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        <circle
          stroke="#E2E8F0"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="#2563EB"
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          style={{
            strokeDashoffset,
            transition: "stroke-dashoffset 0.8s ease-out",
          }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-slate-900">{percent}%</span>
        <span className="text-xs text-slate-500">completed</span>
      </div>
    </div>
  );
}

function DashboardContent() {
  const { firebaseUser } = useAuth();
  const { user } = useUserQuery();
  const {
    todayHabits,
    completedToday,
    totalToday,
    completionPercent,
    remainingToday,
    achievementCount,
    isLoading,
    isError,
    error,
    refreshDashboard,
  } = useDashboard();
  const { summary: reflectionSummary, weeklyReview } = useReflections();

  const dayOfYear = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    return Math.floor((now.getTime() - start.getTime()) / 86400000);
  }, []);

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <ErrorState
        message={error?.message ?? "Failed to load dashboard data"}
        onRetry={refreshDashboard}
      />
    );
  }

  const displayName =
    user?.username || firebaseUser?.displayName || "Adventurer";
  const level = user?.level ?? 1;
  const xp = user?.xp ?? 0;
  const streak = user?.currentStreak ?? 0;
  const totalHabits = user?.totalHabits ?? 0;

  const xpNeeded = levelSpan(level);
  const xpInto = xpIntoLevel(level, xp);
  const xpLeft = xpRemaining(level, xp);
  const xpProgress = levelPercent(level, xp);

  const MOTIVATIONAL_QUOTES = [
    "Small steps every day lead to big changes.",
    "Your future self will thank you.",
    "Discipline is choosing between what you want now and what you want most.",
    "The only way to do great work is to love what you do.",
    "Consistency beats intensity.",
    "Progress, not perfection.",
    "Start where you are. Use what you have.",
    "Today is a new opportunity to grow.",
    "Every expert was once a beginner.",
    "The secret of getting ahead is getting started.",
  ];

  return (
    <div className="flex-1 px-6 py-8">
          {/* Hero Summary */}
          <section className="mb-8">
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-lg">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Welcome back
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    {displayName}{" "}
                    <span
                      className="text-[#2563EB]"
                      aria-label={`Level ${level}`}
                    >
                      Lv.{level}
                    </span>
                  </h2>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Flame className="h-4 w-4 text-[#10B981]" />
                      <span>
                        {streak} day{streak !== 1 ? "s" : ""} streak
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Zap className="h-4 w-4 text-[#10B981]" />
                      <span>{xp} XP</span>
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-56">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
                    <span>XP Progress</span>
                    <span>
                      {xpInto} / {xpNeeded}
                    </span>
                  </div>
                  <div
                    className="h-2.5 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-valuenow={xpProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="XP progress"
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA] transition-all duration-700 ease-out"
                      style={{ width: `${xpProgress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-xs text-slate-400">
                    {xpLeft} XP to Level {level + 1}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Statistics Cards */}
          <section className="mb-8">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Overview
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <PlaceholderCard
                title="Current Level"
                value={level}
                description="Keep earning XP to level up"
                icon={<Star className="h-5 w-5" />}
              />
              <PlaceholderCard
                title="Total XP"
                value={xp.toLocaleString()}
                description="Experience points earned"
                icon={<Zap className="h-5 w-5" />}
              />
              <PlaceholderCard
                title="Day Streak"
                value={streak}
                description={streak === 1 ? "Day in a row" : "Days in a row"}
                icon={<Flame className="h-5 w-5" />}
              />
              <PlaceholderCard
                title="Completed Today"
                value={`${completedToday}/${totalToday}`}
                description={
                  totalToday === 0
                    ? "No habits scheduled"
                    : `${completionPercent}% completed`
                }
                icon={<CheckCircle2 className="h-5 w-5" />}
              />
              <PlaceholderCard
                title="Total Habits"
                value={totalHabits}
                description="Habits being tracked"
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <PlaceholderCard
                title="Achievements"
                value={achievementCount}
                description="Badges unlocked"
                icon={<Trophy className="h-5 w-5" />}
              />
            </div>
          </section>

          {/* XP Progress (dedicated section) */}
          <section className="mb-8">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              XP Progress
            </h3>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-slate-900">
                      {xpInto.toLocaleString()} XP
                    </span>
                    <span className="text-sm text-slate-500">
                      / {xpNeeded.toLocaleString()} XP
                    </span>
                  </div>
                  <div
                    className="h-4 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-valuenow={xpProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="XP progress"
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA] transition-all duration-700 ease-out"
                      style={{ width: `${xpProgress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    {xpProgress}% — {xpLeft} XP remaining to Level{" "}
                    {level + 1}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#2563EB]/10">
                    <Star className="h-7 w-7 text-[#2563EB]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Level {level}
                    </p>
                    <p className="text-xs text-slate-400">
                      → Level {level + 1}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Today's Progress */}
          <section className="mb-8">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Today&apos;s Progress
            </h3>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Completion Ring */}
              <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-6">
                <CircularProgress percent={completionPercent} />
              </div>

              {/* Today's Details */}
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#2563EB]" />
                  <h4 className="text-sm font-semibold text-slate-900">
                    Today&apos;s Habits
                  </h4>
                </div>

                {totalToday === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50">
                      <CheckCircle2 className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-400">
                      No habits scheduled for today
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                      <span className="text-sm text-slate-500">Completed</span>
                      <span className="text-sm font-semibold text-[#10B981]">
                        {completedToday}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                      <span className="text-sm text-slate-500">Remaining</span>
                      <span className="text-sm font-semibold text-[#10B981]">
                        {remainingToday}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                      <span className="text-sm text-slate-500">
                        Completion Rate
                      </span>
                      <span className="text-sm font-semibold text-[#2563EB]">
                        {completionPercent}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Today's Journey - uncompleted habits with start buttons */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Today&apos;s Journey
              </h3>
              <Link
                href="/habits"
                className="flex items-center gap-1 text-xs font-medium text-[#2563EB] transition-colors hover:text-[#1D4ED8]"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              {todayHabits.filter((h) => !h.isCompleted).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#10B981]/10">
                    <CheckCircle2 className="h-6 w-6 text-[#10B981]" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    All done for today!
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    You&apos;ve completed all your habits. Great work!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayHabits
                    .filter((h) => !h.isCompleted)
                    .slice(0, 4)
                    .map((habit) => (
                      <div
                        key={habit.id}
                        className="flex items-center gap-4 rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563EB]/10">
                          <BookOpen className="h-5 w-5 text-[#2563EB]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {habit.title}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {habit.category} &middot; {habit.difficulty} &middot; {habit.xpReward} XP{habit.goalLabel && habit.goalValue != null && (
                              <>
                                {" "}&middot;{" "}
                                <span className="text-[#10B981]">{formatGoal(habit).label}: {formatGoal(habit).value}</span>
                              </>
                            )}
                          </p>
                        </div>
                        <Link
                          href="/habits"
                          className="flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1D4ED8]"
                        >
                          <Play className="h-3 w-3" />
                          Start
                        </Link>
                      </div>
                    ))}
                  {todayHabits.filter((h) => !h.isCompleted).length > 4 && (
                    <p className="text-center text-xs text-slate-400">
                      +{todayHabits.filter((h) => !h.isCompleted).length - 4} more habits
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Weekly Summary & Motivation */}
          <section className="mb-8">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              This Week
            </h3>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Weekly Reflections */}
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#8B5CF6]/10">
                    <BookOpen className="h-5 w-5 text-[#8B5CF6]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {reflectionSummary?.weeklyReflections ?? 0}
                    </p>
                    <p className="text-[11px] text-slate-400">Reflections this week</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Weekly XP from reflections</span>
                    <span className="font-medium text-[#10B981]">
                      {reflectionSummary?.weeklyXpFromReflections ?? 0} XP
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] transition-all duration-700"
                      style={{
                        width: `${Math.min(((reflectionSummary?.weeklyReflections ?? 0) / 7) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Weekly Review Preview */}
              {weeklyReview && (
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#10B981]/10">
                      <Target className="h-5 w-5 text-[#10B981]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {weeklyReview.habitsCompleted} completions
                      </p>
                      <p className="text-[11px] text-slate-400">This week&apos;s activity</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Zap className="h-3 w-3 text-[#10B981]" />
                      {weeklyReview.xpEarned} XP earned
                    </span>
                    <span className="text-[11px] text-slate-300">|</span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Flame className="h-3 w-3 text-orange-500" />
                      {weeklyReview.longestStreak} day streak
                    </span>
                  </div>
                </div>
              )}

              {/* Motivation Card */}
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-[#2563EB]/5 to-[#10B981]/5 p-6">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB]/10">
                    <Sparkles className="h-5 w-5 text-[#2563EB]" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    Daily Motivation
                  </p>
                </div>
                <p className="text-sm italic leading-relaxed text-slate-600">
                  &quot;{MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length]}&quot;
                </p>
                <Link
                  href="/reviews"
                  className="mt-4 flex items-center gap-1 text-xs font-medium text-[#2563EB] transition-colors hover:text-[#1D4ED8]"
                >
                  View weekly review <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </section>

          <GrowthOverviewSection />
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
