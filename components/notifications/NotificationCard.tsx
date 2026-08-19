"use client";

import {
  Bell,
  CheckCircle2,
  Trophy,
  Zap,
  Flame,
  CalendarCheck,
  AlertCircle,
  Trash2,
  BookOpen,
} from "lucide-react";
import type { Notification, NotificationType } from "@/types";
import { cn } from "@/lib/cn";

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  HABIT_REMINDER: { icon: Bell, color: "text-blue-500", bg: "bg-blue-50" },
  HABIT_COMPLETED: {
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  DAILY_QUEST_COMPLETED: {
    icon: CalendarCheck,
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  ACHIEVEMENT_UNLOCKED: {
    icon: Trophy,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  LEVEL_UP: { icon: Zap, color: "text-[#2563EB]", bg: "bg-[#2563EB]/10" },
  STREAK_MILESTONE: {
    icon: Flame,
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  REFLECTION_SAVED: {
    icon: BookOpen,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
  JOURNEY_SAVED: {
    icon: BookOpen,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
  WEEKLY_REVIEW: {
    icon: CalendarCheck,
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  MONTHLY_REVIEW: {
    icon: CalendarCheck,
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  SYSTEM: { icon: AlertCircle, color: "text-slate-500", bg: "bg-slate-50" },
};

function formatTimestamp(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface NotificationCardProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export default function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
  isDeleting,
}: NotificationCardProps) {
  const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.SYSTEM;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "group flex items-start gap-4 rounded-xl border p-4 transition-all",
        !notification.isRead
          ? "border-[#2563EB]/30 bg-[#2563EB]/5"
          : "border-slate-200 bg-white hover:bg-slate-50"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
          config.bg
        )}
      >
        <Icon className={cn("h-5 w-5", config.color)} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-sm font-medium",
                !notification.isRead ? "text-slate-900" : "text-slate-700"
              )}
            >
              {notification.title}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
              {notification.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!notification.isRead && (
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#2563EB]" />
            )}
            <span className="flex-shrink-0 text-[10px] text-slate-400" suppressHydrationWarning>
              {formatTimestamp(notification.createdAt)}
            </span>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          {!notification.isRead && (
            <button
              onClick={() => onMarkRead(notification.id)}
              className="text-[10px] font-medium text-[#2563EB] transition-colors hover:text-[#1D4ED8]"
            >
              Mark as read
            </button>
          )}
          <button
            onClick={() => onDelete(notification.id)}
            disabled={isDeleting}
            className="ml-auto flex items-center gap-1 text-[10px] text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:text-red-500 focus:opacity-100"
            aria-label="Delete notification"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
