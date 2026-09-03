"use client";

import { useMemo } from "react";
import PlaceholderCard from "@/components/PlaceholderCard";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { habitsApi, achievementsApi, progressApi } from "@/lib/api";
import type { Habit, Achievement, UserStatistics } from "@/types";
import { levelSpan, xpIntoLevel, xpRemaining, levelPercent } from "@/lib/xp";
import {
  BarChart3,
  RotateCcw,
  AlertCircle,
  Flame,
  Zap,
  Trophy,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Mail,
  Star,
} from "lucide-react";
import Image from "next/image";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
  Learning: "#2563EB",
  Fitness: "#10B981",
  Reading: "#8B5CF6",
  Meditation: "#F59E0B",
  Coding: "#EC4899",
  Health: "#14B8A6",
  Productivity: "#6366F1",
  Finance: "#F97316",
  Language: "#06B6D4",
  Custom: "#64748B",
};

const PIE_COLORS = [
  "#2563EB",
  "#10B981",
  "#8B5CF6",
  "#F59E0B",
  "#EC4899",
  "#14B8A6",
  "#6366F1",
  "#F97316",
  "#06B6D4",
  "#64748B",
];

interface StatsData {
  habits: Habit[];
  achievements: Achievement[];
  statistics: UserStatistics;
}

function SkeletonStats() {
  return (
    <div className="flex-1 px-6 py-8">
      <div className="animate-pulse space-y-8">
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-white p-8 sm:flex-row">
        <div className="h-20 w-20 rounded-full bg-slate-100" />
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div className="mx-auto h-6 w-40 rounded bg-slate-100 sm:mx-0" />
          <div className="mx-auto h-4 w-56 rounded bg-slate-100 sm:mx-0" />
          <div className="mx-auto flex gap-3 sm:mx-0">
            <div className="h-6 w-20 rounded-full bg-slate-100" />
            <div className="h-6 w-20 rounded-full bg-slate-100" />
            <div className="h-6 w-20 rounded-full bg-slate-100" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-slate-200 bg-white"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-72 rounded-xl border border-slate-200 bg-white" />
        <div className="h-72 rounded-xl border border-slate-200 bg-white" />
      </div>
      <div className="h-72 rounded-xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-8">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-red-500/20 bg-white p-8 text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-sm text-red-400">{message}</p>
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

function EmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-8">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-50">
          <BarChart3 className="h-7 w-7 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-500">
          No activity yet
        </p>
        <p className="max-w-xs text-xs text-slate-400">
          Complete your first habit to start tracking your statistics and
          progress.
        </p>
      </div>
    </div>
  );
}

function StatisticsContent() {
  const { user } = useAuth();
  const { getToken } = useFirebaseToken();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<StatsData, Error>({
    queryKey: ["stats"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const [habitsData, achievementsData, statistics] = await Promise.all([
        habitsApi.getAll(token),
        achievementsApi.getAll(token),
        progressApi.getStatistics(token),
      ]);
      return { habits: habitsData, achievements: achievementsData, statistics };
    },
    enabled: !!getToken,
  });

  const habits = useMemo(() => data?.habits ?? [], [data?.habits]);
  const achievements = useMemo(() => data?.achievements ?? [], [data?.achievements]);
  const statistics = useMemo(() => data?.statistics, [data?.statistics]);

  const level = user?.level ?? 1;
  const xp = user?.xp ?? 0;
  const streak = user?.currentStreak ?? 0;
  const longestStreak = user?.longestStreak ?? 0;
  const totalHabits = habits.length;
  const completedHabits = habits.filter((h) => h.completedAt).length;
  const activeHabits = totalHabits - completedHabits;
  const completionRate =
    totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
  const unlockedAchievements = achievements.filter((a) => a.unlocked).length;
  const totalAchievements = achievements.length;
  const achievementPercent =
    totalAchievements > 0
      ? Math.round((unlockedAchievements / totalAchievements) * 100)
      : 0;

  const xpNeeded = levelSpan(level);
  const xpInto = xpIntoLevel(level, xp);
  const xpLeft = xpRemaining(level, xp);
  const xpProgress = levelPercent(level, xp);

  const displayName =
    user?.username || "Adventurer";

  // Use real server-side statistics for XP chart
  const xpChartData = useMemo(() => {
    return statistics?.xpChartData ?? [];
  }, [statistics]);

  // Use real server-side weekly activity
  const weeklyData = useMemo(() => {
    return statistics?.weeklyActivity ?? [];
  }, [statistics]);

  // Use real server-side category stats for pie chart
  const categoryData = useMemo(() => {
    if (!statistics?.categoryStats) return [];
    return statistics.categoryStats
      .filter((c) => c.completionCount > 0)
      .map((c) => ({ name: c.category, value: c.completionCount }))
      .sort((a, b) => b.value - a.value);
  }, [statistics]);

  // Use real habits for difficulty breakdown
  const difficultyData = useMemo(() => {
    const counts: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };
    habits.forEach((h) => {
      counts[h.difficulty] = (counts[h.difficulty] || 0) + 1;
    });
    return counts;
  }, [habits]);

  // Compute insights from real data
  const insights = useMemo(() => {
    if (!statistics?.weeklyActivity) {
      return { mostProductive: "N/A", leastProductive: "N/A", avgPerDay: "0" };
    }
    const sorted = [...statistics.weeklyActivity].sort(
      (a, b) => b.completions - a.completions
    );
    const mostProductive = sorted[0]?.day ?? "N/A";
    const leastProductive = sorted[sorted.length - 1]?.day ?? "N/A";
    const totalCompletions = statistics.weeklyActivity.reduce(
      (sum, d) => sum + d.completions,
      0
    );
    const avgPerDay = totalHabits > 0 ? (totalCompletions / 7).toFixed(1) : "0";
    return { mostProductive, leastProductive, avgPerDay };
  }, [statistics, totalHabits]);

  if (isLoading) return <SkeletonStats />;

  if (isError) {
    return (
      <ErrorState
        message={error?.message ?? "Failed to load statistics"}
        onRetry={() => refetch()}
      />
    );
  }

  if (totalHabits === 0 && totalAchievements === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex-1 px-6 py-8">
      {/* Header */}
      <section className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Statistics</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your progress at a glance
        </p>
      </section>

          {/* Profile Header */}
          <section className="mb-8">
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-lg sm:p-8">
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <div className="relative flex-shrink-0">
                  {user?.photoUrl ? (
                    <Image
                      src={user.photoUrl}
                      alt={displayName}
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-full object-cover ring-4 ring-[#2563EB]/30"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#60A5FA] text-2xl font-bold text-white ring-4 ring-[#2563EB]/30">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#1E293B] bg-[#2563EB]">
                    <span className="text-[9px] font-bold text-white">
                      {level}
                    </span>
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-xl font-bold text-slate-900">
                    {displayName}
                  </h2>
                  {user?.email && (
                    <div className="mt-1 flex items-center justify-center gap-2 text-sm text-slate-500 sm:justify-start">
                      <Mail className="h-3.5 w-3.5" />
                      {user.email}
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-center gap-3 sm:justify-start">
                    <div className="flex items-center gap-1.5 rounded-full bg-[#2563EB]/10 px-3 py-1">
                      <Star className="h-3.5 w-3.5 text-[#2563EB]" />
                      <span className="text-xs font-semibold text-[#2563EB]">
                        Level {level}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-xs font-semibold text-amber-600">
                        {xp.toLocaleString()} XP
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1">
                      <Flame className="h-3.5 w-3.5 text-orange-500" />
                      <span className="text-xs font-semibold text-orange-600">
                        {streak} day streak
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* XP Progress */}
          <section className="mb-8">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              XP Progress
            </h3>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-slate-900">
                  Level {level}
                </span>
                <span className="text-xs text-slate-500">
                  {xpInto.toLocaleString()} / {xpNeeded.toLocaleString()} XP
                </span>
              </div>
              <div
                className="h-3 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-valuenow={xpProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA] transition-all duration-700 ease-out"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <p className="mt-1.5 text-right text-xs text-slate-400">
                {xpProgress}% — {xpLeft} XP to Level {level + 1}
              </p>
            </div>
          </section>

          {/* Summary Cards */}
          <section className="mb-8">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Summary
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <PlaceholderCard
                title="Total Habits"
                value={totalHabits}
                description="Habits being tracked"
                icon={<CheckCircle2 className="h-5 w-5" />}
              />
              <PlaceholderCard
                title="Completed Habits"
                value={completedHabits}
                description="Habits completed at least once"
                icon={<CheckCircle2 className="h-5 w-5" />}
              />
              <PlaceholderCard
                title="Active Habits"
                value={activeHabits}
                description="Habits not yet completed"
                icon={<Target className="h-5 w-5" />}
              />
              <PlaceholderCard
                title="Completion Rate"
                value={`${completionRate}%`}
                description="Overall completion percentage"
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <PlaceholderCard
                title="Current Streak"
                value={`${streak} days`}
                description="Consecutive active days"
                icon={<Flame className="h-5 w-5" />}
              />
              <PlaceholderCard
                title="Longest Streak"
                value={`${longestStreak} days`}
                description="Best streak record"
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <PlaceholderCard
                title="Total XP"
                value={xp.toLocaleString()}
                description="Experience points earned"
                icon={<Zap className="h-5 w-5" />}
              />
              <PlaceholderCard
                title="Current Level"
                value={level}
                description="Keep earning XP to level up"
                icon={<Trophy className="h-5 w-5" />}
              />
            </div>
          </section>

          {/* Charts Row */}
          <section className="mb-8">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Weekly Activity Chart */}
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Weekly Activity
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 12, fill: "#64748B" }}
                        axisLine={{ stroke: "#E2E8F0" }}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: "#64748B" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #E2E8F0",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          fontSize: "12px",
                        }}
                      />
                      <Bar
                        dataKey="completions"
                        name="Habits Completed"
                        fill="#2563EB"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* XP Progress Chart */}
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  XP Progress (Last 7 Days)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={xpChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 12, fill: "#64748B" }}
                        axisLine={{ stroke: "#E2E8F0" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#64748B" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #E2E8F0",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          fontSize: "12px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="xp"
                        name="XP"
                        stroke="#2563EB"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "#2563EB" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>

          {/* Category Pie Chart + Insights */}
          <section className="mb-8">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Category Chart */}
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Habits by Category
                </h3>
                {categoryData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={
                                CATEGORY_COLORS[entry.name] ||
                                PIE_COLORS[index % PIE_COLORS.length]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid #E2E8F0",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            fontSize: "12px",
                          }}
                        />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: "12px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    No category data available
                  </div>
                )}
              </div>

              {/* Productivity Insights */}
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Productivity Insights
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-3">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-medium text-slate-700">
                        Most Productive Day
                      </span>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">
                      {insights.mostProductive}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-red-50 p-3">
                    <div className="flex items-center gap-3">
                      <TrendingDown className="h-4 w-4 text-red-400" />
                      <span className="text-sm font-medium text-slate-700">
                        Least Productive Day
                      </span>
                    </div>
                    <span className="text-sm font-bold text-red-500">
                      {insights.leastProductive}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />
                      <span className="text-sm font-medium text-slate-700">
                        Completion Rate
                      </span>
                    </div>
                    <span className="text-sm font-bold text-[#2563EB]">
                      {completionRate}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium text-slate-700">
                        Avg. Habits / Day
                      </span>
                    </div>
                    <span className="text-sm font-bold text-amber-600">
                      {insights.avgPerDay}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center gap-3">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium text-slate-700">
                        Current Streak
                      </span>
                    </div>
                    <span className="text-sm font-bold text-orange-600">
                      {streak} days
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium text-slate-700">
                        Longest Streak
                      </span>
                    </div>
                    <span className="text-sm font-bold text-purple-600">
                      {longestStreak} days
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Achievement Progress */}
          <section className="mb-8">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Achievement Progress
            </h3>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-slate-900">
                  {unlockedAchievements} of {totalAchievements} unlocked
                </span>
                <span className="text-xs text-slate-500">
                  {achievementPercent}% complete
                </span>
              </div>
              <div
                className="mb-4 h-3 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-valuenow={achievementPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-700 ease-out"
                  style={{ width: `${achievementPercent}%` }}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {achievements.slice(0, 6).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-lg bg-slate-50 p-3"
                  >
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm ${
                        a.unlocked
                          ? "bg-amber-100 text-amber-600"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-700">
                        {a.title}
                      </p>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              Math.round((a.progress / a.target) * 100),
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="flex-shrink-0 text-[10px] text-slate-400">
                      {a.progress}/{a.target}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Recent Activity */}
          {habits.filter((h) => h.completedAt).length > 0 && (
            <section className="mb-8">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Recent Activity
              </h3>
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="space-y-3">
                  {habits
                    .filter((h): h is Habit & { completedAt: NonNullable<Habit["completedAt"]> } => !!h.completedAt)
                    .sort(
                      (a, b) =>
                        new Date(b.completedAt).getTime() -
                        new Date(a.completedAt).getTime()
                    )
                    .slice(0, 10)
                    .map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-700">
                              {h.title}
                            </p>
                            <p className="text-xs text-slate-400" suppressHydrationWarning>
                              {new Date(h.completedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1">
                          <Zap className="h-3 w-3 text-amber-500" />
                          <span className="text-xs font-semibold text-amber-600">
                            +{h.xpReward} XP
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </section>
          )}

          {/* Difficulty Breakdown */}
          {totalHabits > 0 && (
            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Habits by Difficulty
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {(["Easy", "Medium", "Hard"] as const).map((diff) => {
                  const count = difficultyData[diff];
                  const color =
                    diff === "Easy"
                      ? "text-emerald-500"
                      : diff === "Medium"
                        ? "text-[#2563EB]"
                        : "text-red-500";
                  const bg =
                    diff === "Easy"
                      ? "bg-emerald-50"
                      : diff === "Medium"
                        ? "bg-[#2563EB]/5"
                        : "bg-red-50";
                  return (
                    <div
                      key={diff}
                      className={`rounded-xl border border-slate-200 p-5 text-center ${bg}`}
                    >
                      <p className={`text-2xl font-bold ${color}`}>{count}</p>
                      <p className="mt-1 text-sm text-slate-500">{diff}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
    </div>
  );
}

export default function StatisticsPage() {
  return <StatisticsContent />;
}
