"use client";

import { useQuery } from "@tanstack/react-query";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { adminApi } from "@/lib/api";
import type { AdminStats, AdminCharts } from "@/types";
import {
  Users,
  TrendingUp,
  CheckSquare,
  Trophy,
  Zap,
  Flame,
  BarChart3,
  Activity,
  Loader2,
} from "lucide-react";
import StatCard from "@/components/admin/StatCard";
import {
  GrowthTrendChart,
  HabitCompletionsChart,
  CategoryDistributionChart,
  XpEarnedChart,
} from "@/components/admin/AdminCharts";

export default function AdminStatisticsPage() {
  const { getToken } = useFirebaseToken();

  const {
    data: stats,
    isLoading,
    isError,
    refetch,
  } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return adminApi.getStats(token);
    },
    enabled: !!getToken,
  });

  const {
    data: charts,
    isLoading: chartsLoading,
  } = useQuery<AdminCharts>({
    queryKey: ["admin-charts"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return adminApi.getCharts(token);
    },
    enabled: !!getToken,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-sm text-red-500">Failed to load statistics.</p>
        <button
          onClick={() => refetch()}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const avgHabitsPerUser =
    stats.totalUsers > 0
      ? (stats.totalHabits / stats.totalUsers).toFixed(1)
      : "0";

  const statCards = [
    {
      title: "Total Registrations",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: "bg-[#2563EB]/10 text-[#2563EB]",
    },
    {
      title: "Total Habits",
      value: stats.totalHabits.toLocaleString(),
      icon: CheckSquare,
      color: "bg-blue-100 text-blue-500",
    },
    {
      title: "Habits Completed",
      value: stats.totalCompletions.toLocaleString(),
      icon: TrendingUp,
      color: "bg-amber-100 text-amber-500",
    },
    {
      title: "Total XP Earned",
      value: stats.totalXpEarned.toLocaleString(),
      icon: Zap,
      color: "bg-orange-100 text-orange-500",
    },
    {
      title: "Achievements Unlocked",
      value: stats.totalAchievementsUnlocked.toLocaleString(),
      icon: Trophy,
      color: "bg-purple-100 text-purple-500",
    },
    {
      title: "Quests Completed",
      value: stats.totalQuestsCompleted.toLocaleString(),
      icon: BarChart3,
      color: "bg-slate-100 text-slate-500",
    },
    {
      title: "Notifications Sent",
      value: stats.totalNotifications.toLocaleString(),
      icon: Activity,
      color: "bg-[#10B981]/10 text-[#10B981]",
    },
    {
      title: "Avg. Habits Per User",
      value: avgHabitsPerUser,
      icon: Flame,
      color: "bg-red-100 text-red-500",
    },
  ];

  const insights = [
    { label: "Total Users", value: stats.totalUsers.toLocaleString() },
    { label: "Total Habits", value: stats.totalHabits.toLocaleString() },
    { label: "Total Completions", value: stats.totalCompletions.toLocaleString() },
    { label: "Total XP", value: stats.totalXpEarned.toLocaleString() },
    { label: "Achievements", value: stats.totalAchievementsUnlocked.toLocaleString() },
    { label: "Notifications", value: stats.totalNotifications.toLocaleString() },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Statistics</h1>
        <p className="mt-1 text-sm text-slate-500">
          Platform-wide analytics and insights.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {!chartsLoading && charts && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <GrowthTrendChart charts={charts} />
            <HabitCompletionsChart charts={charts} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <CategoryDistributionChart charts={charts} />
            <XpEarnedChart charts={charts} />
          </div>
        </>
      )}
      {chartsLoading && (
        <div className="grid gap-6 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900">
          Key Insights
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight) => (
            <div
              key={insight.label}
              className="rounded-lg border border-slate-100 bg-slate-50 p-4"
            >
              <p className="text-xs text-slate-400">{insight.label}</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {insight.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
