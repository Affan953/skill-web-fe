"use client";

import { useState } from "react";
import {
  Bell,
  Mail,
  MailOpen,
  Trash2,
  CheckCheck,
  Filter,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { adminApi } from "@/lib/api";
import type { AdminNotificationRow } from "@/types";

function timeAgo(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

const typeColors: Record<string, string> = {
  HABIT_COMPLETED: "bg-[#10B981]/10 text-[#10B981]",
  ACHIEVEMENT_UNLOCKED: "bg-amber-100 text-amber-500",
  LEVEL_UP: "bg-[#2563EB]/10 text-[#2563EB]",
  DAILY_QUEST_COMPLETED: "bg-purple-100 text-purple-500",
  STREAK_MILESTONE: "bg-orange-100 text-orange-500",
  SYSTEM: "bg-slate-100 text-slate-500",
  HABIT_REMINDER: "bg-blue-100 text-blue-500",
};

const statusColors: Record<string, string> = {
  Unread: "bg-[#2563EB]/10 text-[#2563EB]",
  Read: "bg-slate-100 text-slate-500",
};

export default function AdminNotificationsPage() {
  const { getToken } = useFirebaseToken();
  const [filter, setFilter] = useState<string>("All");

  const {
    data: notifications = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<AdminNotificationRow[]>({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return adminApi.getNotifications(token);
    },
    enabled: !!getToken,
  });

  const mapped = notifications.map((n) => ({
    ...n,
    status: n.isRead ? ("Read" as const) : ("Unread" as const),
  }));

  const unread = mapped.filter((n) => n.status === "Unread").length;
  const read = mapped.filter((n) => n.status === "Read").length;

  const filtered =
    filter === "All"
      ? mapped
      : mapped.filter((n) => n.status === filter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Notifications Overview
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor all platform notifications.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-sm text-slate-500">Failed to load notifications.</p>
          <button
            onClick={() => refetch()}
            className="mt-3 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Notifications Overview
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor all platform notifications.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#2563EB]/10 p-2.5">
              <Mail className="h-5 w-5 text-[#2563EB]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{unread}</p>
              <p className="text-xs text-slate-500">Unread</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#10B981]/10 p-2.5">
              <MailOpen className="h-5 w-5 text-[#10B981]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{read}</p>
              <p className="text-xs text-slate-500">Read</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400" />
        {["All", "Unread", "Read"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f
                ? "bg-[#2563EB] text-white"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="divide-y divide-slate-100">
          {filtered.map((notif) => (
            <div
              key={notif.id}
              className="flex items-start gap-3 px-6 py-4 transition-colors hover:bg-slate-50"
            >
              <div
                className={`mt-0.5 rounded-lg p-1.5 ${
                  typeColors[notif.type] || "bg-slate-100 text-slate-500"
                }`}
              >
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {notif.title}
                  </p>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      statusColors[notif.status] || ""
                    }`}
                  >
                    {notif.status}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  {notif.description}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {timeAgo(notif.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#2563EB]"
                  aria-label="Mark as read"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
                <button
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500"
                  aria-label="Delete notification"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
