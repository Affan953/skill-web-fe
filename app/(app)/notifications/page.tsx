"use client";

import { useMemo, useState, useCallback } from "react";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api";
import type { Notification } from "@/types";
import { Search, CheckCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import NotificationCard from "@/components/notifications/NotificationCard";
import NotificationSkeleton from "@/components/notifications/NotificationSkeleton";
import NotificationEmpty from "@/components/notifications/NotificationEmpty";
import NotificationError from "@/components/notifications/NotificationError";

type FilterTab = "all" | "unread" | "read";
const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "read", label: "Read" },
];

function groupNotifications(notifications: Notification[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const groups: { label: string; items: Notification[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Earlier", items: [] },
  ];

  notifications.forEach((n) => {
    const d = new Date(n.createdAt);
    if (d >= todayStart) {
      groups[0].items.push(n);
    } else if (d >= yesterdayStart) {
      groups[1].items.push(n);
    } else {
      groups[2].items.push(n);
    }
  });

  return groups.filter((g) => g.items.length > 0);
}

function NotificationsContent() {
  const { getToken } = useFirebaseToken();
  const queryClient = useQueryClient();

  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Notification[], Error>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return notificationsApi.getAll(token);
    },
    enabled: !!getToken,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return notificationsApi.markAsRead(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return notificationsApi.markAllAsRead(token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return notificationsApi.delete(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = [...notifications];

    if (activeFilter === "unread") {
      result = result.filter((n) => !n.isRead);
    } else if (activeFilter === "read") {
      result = result.filter((n) => n.isRead);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q)
      );
    }

    return result;
  }, [notifications, activeFilter, search]);

  const groups = useMemo(() => groupNotifications(filtered), [filtered]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const handleMarkRead = useCallback(
    (id: string) => {
      markReadMutation.mutate(id);
    },
    [markReadMutation]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation]
  );

  return (
    <div className="flex-1 px-6 py-8">
      {/* Header */}
      <section className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Stay updated on your progress
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-[#2563EB]/10 px-2 py-0.5 text-xs font-medium text-[#2563EB]">
                  {unreadCount} unread
                </span>
              )}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              <CheckCheck className="h-4 w-4" />
              {markAllReadMutation.isPending
                ? "Marking..."
                : "Mark all as read"}
            </button>
          )}
        </div>
      </section>

          {/* Filters & Search */}
          <section className="mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveFilter(tab.key)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      activeFilter === tab.key
                        ? "bg-[#2563EB] text-white"
                        : "bg-white text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    {tab.label}
                    {tab.key === "unread" && unreadCount > 0 && (
                      <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white/20 px-1 text-[10px]">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] sm:w-64"
                />
              </div>
            </div>
          </section>

          {/* Notification List */}
          <section>
            {isLoading ? (
              <NotificationSkeleton />
            ) : isError ? (
              <NotificationError
                message={error?.message ?? "Failed to load notifications"}
                onRetry={() => refetch()}
              />
            ) : filtered.length === 0 ? (
              <NotificationEmpty />
            ) : (
              <div className="space-y-6">
                {groups.map((group) => (
                  <div key={group.label}>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {group.label}
                    </h3>
                    <div className="space-y-2">
                      {group.items.map((notification) => (
                        <NotificationCard
                          key={notification.id}
                          notification={notification}
                          onMarkRead={handleMarkRead}
                          onDelete={handleDelete}
                          isDeleting={deleteMutation.isPending}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
    </div>
  );
}

export default function NotificationsPage() {
  return <NotificationsContent />;
}
