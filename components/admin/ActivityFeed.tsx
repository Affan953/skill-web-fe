"use client";

import { useQuery } from "@tanstack/react-query";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { adminApi } from "@/lib/api";
import type { AdminNotificationRow } from "@/types";
import {
  CheckCircle,
  Trophy,
  Target,
  Zap,
  Bell,
  UserPlus,
  Loader2,
} from "lucide-react";

const NOTIFICATION_TYPE_CONFIG: Record<
  string,
  { icon: typeof CheckCircle; color: string }
> = {
  HABIT_COMPLETED: {
    icon: CheckCircle,
    color: "bg-[#10B981]/10 text-[#10B981]",
  },
  ACHIEVEMENT_UNLOCKED: {
    icon: Trophy,
    color: "bg-amber-100 text-amber-500",
  },
  DAILY_QUEST_COMPLETED: {
    icon: Target,
    color: "bg-purple-100 text-purple-500",
  },
  LEVEL_UP: {
    icon: Zap,
    color: "bg-[#2563EB]/10 text-[#2563EB]",
  },
  STREAK_MILESTONE: {
    icon: Zap,
    color: "bg-orange-100 text-orange-500",
  },
  HABIT_REMINDER: {
    icon: Bell,
    color: "bg-slate-100 text-slate-500",
  },
  SYSTEM: {
    icon: UserPlus,
    color: "bg-blue-100 text-blue-500",
  },
};

function timeAgo(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
}

export default function ActivityFeed() {
  const { getToken } = useFirebaseToken();

  const { data: notifications = [], isLoading } = useQuery<
    AdminNotificationRow[],
    Error
  >({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return adminApi.getNotifications(token);
    },
    enabled: !!getToken,
  });

  const recentActivity = notifications.slice(0, 8);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Recent Activity
        </h3>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      ) : recentActivity.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-slate-400">No recent activity</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {recentActivity.map((item) => {
            const config =
              NOTIFICATION_TYPE_CONFIG[item.type] ?? NOTIFICATION_TYPE_CONFIG.SYSTEM;
            const Icon = config.icon;
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 px-6 py-4 transition-colors hover:bg-slate-50"
              >
                <div className={`mt-0.5 rounded-lg p-1.5 ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700">
                    <span className="font-medium text-slate-900">
                      {item.ownerName}
                    </span>{" "}
                    — {item.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {timeAgo(item.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
