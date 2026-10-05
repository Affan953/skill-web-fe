"use client";

import { useCallback } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { useAuth } from "@/contexts/AuthContext";
import type { Notification, NotificationPage } from "@/types";

export const NOTIFICATIONS_KEY = "notifications";
export const NOTIFICATIONS_UNREAD_KEY = "notifications-unread-count";
export const NOTIFICATIONS_QUERY_KEY = (uid: string) =>
  [NOTIFICATIONS_KEY, uid] as const;
export const NOTIFICATIONS_UNREAD_QUERY_KEY = (uid: string) =>
  [NOTIFICATIONS_UNREAD_KEY, uid] as const;

const DEFAULT_PAGE_SIZE = 20;

/** Badge freshness. The list itself is refetched on focus by React Query. */
const UNREAD_POLL_INTERVAL_MS = 30_000;

/**
 * Cursor-paginated notification list for the authenticated user.
 *
 * Scoped by uid so signing in as a different user can never surface the
 * previous account's cached pages.
 */
export function useNotifications() {
  const { user } = useAuth();
  const { getToken, isAuthenticated } = useFirebaseToken();
  const uid = user?.uid ?? "";

  const fetchPage = useCallback(
    async (pageParam: string | null) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return notificationsApi.getAll(
        token,
        pageParam ?? undefined,
        DEFAULT_PAGE_SIZE
      );
    },
    [getToken]
  );

  return useInfiniteQuery<
    NotificationPage,
    Error,
    InfiniteData<NotificationPage, string | null>,
    readonly [string, string],
    string | null
  >({
    queryKey: NOTIFICATIONS_QUERY_KEY(uid),
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: isAuthenticated && !!uid,
    staleTime: 30_000,
  });
}

/**
 * Unread count for the navbar badge. Polled on a fixed interval rather than
 * pushed — Phase 33 territory is WebSocket, not this.
 */
export function useUnreadNotificationCount() {
  const { user } = useAuth();
  const { getToken, isAuthenticated } = useFirebaseToken();
  const uid = user?.uid ?? "";

  const { data, isLoading, isError } = useQuery<{ unreadCount: number }, Error>({
    queryKey: NOTIFICATIONS_UNREAD_QUERY_KEY(uid),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return notificationsApi.getUnreadCount(token);
    },
    enabled: isAuthenticated && !!uid,
    refetchInterval: UNREAD_POLL_INTERVAL_MS,
    staleTime: UNREAD_POLL_INTERVAL_MS,
  });

  return {
    count: data?.unreadCount ?? 0,
    isLoading,
    isError,
  };
}

/**
 * Read-state mutations.
 *
 * `markAsRead` and `delete` are applied to the cache optimistically so the row
 * updates instantly, and roll back if the server rejects the write. The count
 * query is refetched (not guessed) so the badge can never drift.
 */
export function useNotificationMutations() {
  const { user } = useAuth();
  const { getToken } = useFirebaseToken();
  const queryClient = useQueryClient();
  const uid = user?.uid ?? "";
  const listKey = NOTIFICATIONS_QUERY_KEY(uid);
  const countKey = NOTIFICATIONS_UNREAD_QUERY_KEY(uid);

  const refreshCount = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: countKey });
  }, [queryClient, countKey]);

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return notificationsApi.markAsRead(id, token);
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<
        InfiniteData<NotificationPage, string | null>
      >(listKey);

      queryClient.setQueryData<InfiniteData<NotificationPage, string | null>>(
        listKey,
        (old) =>
          old
            ? {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  items: page.items.map((n: Notification) =>
                    n.id === id ? { ...n, isRead: true } : n
                  ),
                })),
              }
            : old
      );

      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listKey });
      refreshCount();
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return notificationsApi.markAllAsRead(token);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listKey });
      refreshCount();
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return notificationsApi.delete(id, token);
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<
        InfiniteData<NotificationPage, string | null>
      >(listKey);

      queryClient.setQueryData<InfiniteData<NotificationPage, string | null>>(
        listKey,
        (old) =>
          old
            ? {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  items: page.items.filter((n: Notification) => n.id !== id),
                })),
              }
            : old
      );

      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listKey });
      refreshCount();
    },
  });

  return { markAsRead, markAllAsRead, remove };
}
