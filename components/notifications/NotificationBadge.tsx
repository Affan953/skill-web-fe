"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { notificationsApi } from "@/lib/api";

export default function NotificationBadge() {
  const { getToken, isAuthenticated } = useFirebaseToken();

  const { data } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return notificationsApi.getUnreadCount(token);
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const count = data?.unreadCount ?? 0;

  return (
    <Link
      href="/notifications"
      className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
