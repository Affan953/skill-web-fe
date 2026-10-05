"use client";

import { useCallback, useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { safetyApi, getUserFacingError } from "@/lib/api";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { FEED_KEY } from "@/hooks/useGrowthFeed";
import { MY_CIRCLES_QUERY_KEY } from "@/hooks/useCircles";
import type {
  BlockedUsersListResult,
  BlockResponse,
  CreateReportInput,
  MyReport,
  MyReportsListResult,
} from "@/types";

export const BLOCKED_USERS_KEY = "blocked-users";
export const MY_REPORTS_KEY = "my-reports";

/** Page size for the Blocked Users list. Matches the backend's own default. */
export const BLOCKED_USERS_PAGE_SIZE = 20;

export const BLOCKED_USERS_QUERY_KEY = ["blocked-users"] as const;
export const MY_REPORTS_QUERY_KEY = ["my-reports"] as const;

/**
 * The viewer's blocked users, newest first.
 *
 * Paginated with `useInfiniteQuery` and the backend's own cursor, matching
 * `useDiscoverCircles`. Unblocking is the only write that touches this query:
 * it removes the row server-side, so the cache is refetched rather than
 * spliced. A surgical splice is tempting and wrong — the remaining pages and
 * the block count would drift, and the only value that can be trusted about a
 * moderation action is the server's answer.
 */
export function useBlockedUsers(options: { enabled?: boolean } = {}) {
  const { getToken, isAuthenticated } = useFirebaseToken();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery<
    BlockedUsersListResult,
    Error,
    InfiniteData<BlockedUsersListResult, string | null>,
    readonly [string],
    string | null
  >({
    queryKey: BLOCKED_USERS_QUERY_KEY,
    queryFn: async ({ pageParam }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return safetyApi.getBlockedUsers(
        token,
        pageParam ?? undefined,
        BLOCKED_USERS_PAGE_SIZE
      );
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: isAuthenticated && options.enabled !== false,
    staleTime: 30_000,
  });

  const unblockMutation = useMutation<BlockResponse, Error, string>({
    mutationFn: async (username: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      // Addressed by username: `BlockedUser` intentionally carries no uid.
      return safetyApi.unblockUser(username, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BLOCKED_USERS_QUERY_KEY });
    },
  });

  const unblock = useCallback(
    (username: string) => unblockMutation.mutateAsync(username),
    [unblockMutation]
  );

  // Flattened across pages. The backend skips rows whose account has since been
  // deleted, so this can be shorter than `pageSize * pageCount` — that is
  // intended, not a pagination bug.
  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data]
  );

  return {
    items,
    totalLoaded: items.length,
    hasMore: query.hasNextPage ?? false,
    isLoadingNext: query.isFetchingNextPage,
    loadMore: () => query.fetchNextPage(),
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    unblock,
    /** Username currently being unblocked, for per-row spinners. */
    unblockingUsername: unblockMutation.isPending
      ? (unblockMutation.variables ?? null)
      : null,
    isUnblocking: unblockMutation.isPending,
    unblockError: unblockMutation.isError
      ? getUserFacingError(unblockMutation.error)
      : null,
    listError: query.isError ? getUserFacingError(query.error) : null,
  };
}

/**
 * Block a user.
 *
 * Invalidates far more than the block list on purpose. A block severs the
 * follow relationship in both directions server-side and hides the target from
 * the feed, search and the growth-circle discovery surface, so every cached
 * read that could still be showing them has to be refetched. Leaving stale
 * rows on screen after a successful block would tell the user the block did not
 * work.
 */
export function useBlockUser() {
  const { getToken } = useFirebaseToken();
  const queryClient = useQueryClient();

  return useMutation<BlockResponse, Error, string>({
    mutationFn: async (userId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return safetyApi.blockUser(userId, token);
    },
    onSuccess: () => {
      // Prefixes, not full keys: every entry point below takes a uid/username
      // argument, and invalidating the prefix refetches all of them. These
      // strings must match the ones the owning hooks declare.
      const affectedPrefixes = [
        BLOCKED_USERS_QUERY_KEY,
        ["follow-status"],
        ["follow-counts"],
        ["followers"],
        ["following"],
        [FEED_KEY],
        ["user-profile"],
        ["user-search"],
        MY_CIRCLES_QUERY_KEY,
        ["discover-circles"],
        ["circle-detail"],
        ["circle-members"],
        ["conversations"],
        ["conversation"],
      ] as const;

      for (const queryKey of affectedPrefixes) {
        queryClient.invalidateQueries({ queryKey: queryKey as readonly unknown[] });
      }
    },
  });
}

/**
 * File a report about a user.
 *
 * A report is a moderation signal, not a block: the reported user is not
 * notified and nothing is hidden from them, so no social cache is invalidated
 * here. Only the caller's own report history changes, because that list now has
 * a new row.
 */
export function useReportUser() {
  const { getToken } = useFirebaseToken();
  const queryClient = useQueryClient();

  return useMutation<MyReport, Error, CreateReportInput>({
    mutationFn: async (input: CreateReportInput) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return safetyApi.createReport(input, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_REPORTS_QUERY_KEY });
    },
  });
}

/**
 * The caller's own reports. Present so the surface is complete and testable
 * against the real endpoint; the settings screen only mounts it on demand.
 */
export function useMyReports(options: { enabled?: boolean } = {}) {
  const { getToken, isAuthenticated } = useFirebaseToken();

  return useQuery<MyReportsListResult, Error>({
    queryKey: MY_REPORTS_QUERY_KEY,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return safetyApi.getMyReports(token, undefined, BLOCKED_USERS_PAGE_SIZE);
    },
    enabled: isAuthenticated && options.enabled !== false,
    staleTime: 30_000,
  });
}
