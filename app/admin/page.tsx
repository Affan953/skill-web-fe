"use client";

import {
  Users,
  CheckSquare,
  Trophy,
  Target,
  Zap,
  Bell,
  TrendingUp,
  Loader2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { adminApi } from "@/lib/api";
import type { AdminStats, AdminCharts } from "@/types";
import StatCard from "@/components/admin/StatCard";
import ActivityFeed from "@/components/admin/ActivityFeed";
import {
  WeeklyActiveUsersChart,
  XpDistributionChart,
  CompletionRateChart,
  GrowthTrendChart,
} from "@/components/admin/AdminCharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function AdminDashboardPage() {
  const { getToken } = useFirebaseToken();

  const {
    data: stats,
    isLoading,
    isError,
    error,
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
    data: health,
    isLoading: healthLoading,
  } = useQuery<{ status: string; firestore: string }, Error>({
    queryKey: ["admin-health"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/health`);
      if (!res.ok) throw new Error("Health check failed");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const {
    data: charts,
    isLoading: chartsLoading,
  } = useQuery<AdminCharts, Error>({
    queryKey: ["admin-charts"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return adminApi.getCharts(token);
    },
    enabled: !!getToken,
  });

  const statCards = stats
    ? [
        {
          title: "Total Users",
          value: stats.totalUsers.toLocaleString(),
          description: "All registered users",
          icon: Users,
          color: "bg-[#2563EB]/10 text-[#2563EB]",
        },
        {
          title: "Total Habits",
          value: stats.totalHabits.toLocaleString(),
          description: "Total habits created",
          icon: CheckSquare,
          color: "bg-blue-100 text-blue-500",
        },
        {
          title: "Habits Completed",
          value: stats.totalCompletions.toLocaleString(),
          description: "All time completions",
          icon: CheckSquare,
          color: "bg-[#10B981]/10 text-[#10B981]",
        },
        {
          title: "Total XP Earned",
          value: stats.totalXpEarned.toLocaleString(),
          description: "Experience points earned",
          icon: Zap,
          color: "bg-orange-100 text-orange-500",
        },
        {
          title: "Achievements Unlocked",
          value: stats.totalAchievementsUnlocked.toLocaleString(),
          description: "Total unlocked",
          icon: Trophy,
          color: "bg-amber-100 text-amber-500",
        },
        {
          title: "Quests Completed",
          value: stats.totalQuestsCompleted.toLocaleString(),
          description: "Daily quests finished",
          icon: Target,
          color: "bg-purple-100 text-purple-500",
        },
        {
          title: "Notifications Sent",
          value: stats.totalNotifications.toLocaleString(),
          description: "All time notifications",
          icon: Bell,
          color: "bg-slate-100 text-slate-500",
        },
      ]
    : [];

  const isApiUp = health?.status === "ok";
  const isFirestoreConnected = health?.firestore === "connected";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of your SkillUp RPG platform.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
          <p className="mt-2 text-sm font-medium text-red-800">
            {error?.message || "Failed to load admin stats"}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Stat Cards */}
      {!isLoading && !isError && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              icon={stat.icon}
              color={stat.color}
            />
          ))}
        </div>
      )}

      {/* Charts Row */}
      {!chartsLoading && charts && (
        <div className="grid gap-6 lg:grid-cols-2">
          <WeeklyActiveUsersChart charts={charts} />
          <XpDistributionChart charts={charts} />
          <CompletionRateChart charts={charts} />
          <GrowthTrendChart charts={charts} />
        </div>
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

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-slate-900">
              Quick Actions
            </h3>
            <div className="mt-4 space-y-2">
              <a
                href="/admin/notifications"
                className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Send Notification
              </a>
              <a
                href="/admin/users"
                className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                View All Users
              </a>
              <a
                href="/admin/achievements"
                className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Manage Achievements
              </a>
              <a
                href="/admin/settings"
                className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                System Settings
              </a>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-slate-900">
              Platform Health
            </h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">API Status</span>
                {healthLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                ) : (
                  <span
                    className={`flex items-center gap-1.5 text-sm font-medium ${
                      isApiUp ? "text-[#10B981]" : "text-red-500"
                    }`}
                  >
                    <TrendingUp className="h-3 w-3" />
                    {isApiUp ? "Operational" : "Down"}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Firestore</span>
                {healthLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                ) : (
                  <span
                    className={`text-sm font-medium ${
                      isFirestoreConnected ? "text-[#10B981]" : "text-red-500"
                    }`}
                  >
                    {isFirestoreConnected ? "Connected" : "Disconnected"}
                  </span>
                )}
              </div>
              {stats && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Avg. Habits/User</span>
                    <span className="text-sm font-medium text-slate-700">
                      {stats.totalUsers > 0
                        ? (stats.totalHabits / stats.totalUsers).toFixed(1)
                        : "0"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Completion Rate</span>
                    <span className="text-sm font-medium text-slate-700">
                      {stats.totalHabits > 0
                        ? Math.round((stats.totalCompletions / stats.totalHabits) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
