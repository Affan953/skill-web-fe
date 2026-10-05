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
  UserPlus,
  Heart,
  MessageCircle,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Notification, NotificationType } from "@/types";
import { cn } from "@/lib/cn";
import { timeAgo } from "@/lib/timeAgo";

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  FOLLOW: { icon: UserPlus, color: "text-[#2563EB]", bg: "bg-[#2563EB]/10" },
  REACTION: { icon: Heart, color: "text-rose-500", bg: "bg-rose-50" },
  COMMENT: {
    icon: MessageCircle,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
  },
  MESSAGE: {
    icon: MessageSquare,
    color: "text-[#2563EB]",
    bg: "bg-[#2563EB]/10",
  },
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

/**
 * Where a notification takes you. Built from a fixed allowlist of route
 * templates — the id is always encoded into a path segment, never interpolated
 * as a raw URL, so a hostile stored value cannot become a `javascript:` target.
 * Returns null when there is nothing meaningful to open, which makes the row
 * non-navigable instead of guessing.
 */
export function notificationHref(
  notification: Notification
): string | null {
  const { entityType, entityId, actor } = notification;

  if (entityType === "GROWTH_ACTIVITY" && entityId) {
    return `/feed/activity/${encodeURIComponent(entityId)}`;
  }
  if (entityType === "CONVERSATION" && entityId) {
    return `/messages/${encodeURIComponent(entityId)}`;
  }
  if (entityType === "USER" && entityId) {
    // Prefer the actor's handle so the link is stable and human-readable.
    const handle = actor?.username ?? entityId;
    return `/users/${encodeURIComponent(handle)}`;
  }
  if (entityType === "ACHIEVEMENT") return "/achievements";
  if (entityType === "DAILY_QUEST") return "/daily-quests";

  return null;
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
  const router = useRouter();
  const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.SYSTEM;
  const Icon = config.icon;
  const href = notificationHref(notification);
  const actorName = notification.actor?.displayName;

  const handleOpen = () => {
    // Marking read on open is the expected inbox behaviour, and it is safe to
    // fire before navigating because the mutation is optimistic.
    if (!notification.isRead) onMarkRead(notification.id);
    if (href) router.push(href);
  };

  return (
    <div
      className={cn(
        "group relative flex items-start gap-4 rounded-xl border p-4 transition-all",
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
              {actorName ? (
                <>
                  <span className="font-semibold">{actorName}</span>{" "}
                  <span className="font-normal text-slate-600">
                    {notification.title.toLowerCase()}
                  </span>
                </>
              ) : (
                notification.title
              )}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
              {notification.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!notification.isRead && (
              <>
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#2563EB]" />
                <span className="sr-only">Unread</span>
              </>
            )}
            <span
              className="flex-shrink-0 text-[10px] text-slate-400"
              suppressHydrationWarning
            >
              {timeAgo(notification.createdAt) ?? ""}
            </span>
          </div>
        </div>

        <div className="relative z-10 mt-2 flex items-center gap-2">
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

      {href && (
        <button
          onClick={handleOpen}
          className="absolute inset-0 z-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
          aria-label={
            actorName
              ? `Open notification from ${actorName}`
              : "Open notification"
          }
        >
          <span className="sr-only">
            {actorName
              ? `${actorName} ${notification.title}. Open ${href}`
              : `${notification.title}. Open ${href}`}
          </span>
        </button>
      )}
    </div>
  );
}
