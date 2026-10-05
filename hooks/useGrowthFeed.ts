"use client";

import { useCallback } from "react";
import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import { feedApi } from "@/lib/api";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { useAuth } from "@/contexts/AuthContext";
import type { GrowthFeedResult } from "@/types";

export const FEED_KEY = "growth-feed";
export const FEED_QUERY_KEY = (uid: string) => [FEED_KEY, uid] as const;

const DEFAULT_PAGE_SIZE = 20;

/**
 * Cursor-paginated growth feed for the authenticated viewer.
 * Own activities plus followed users' activities, newest first.
 */
export function useGrowthFeed() {
  const { user } = useAuth();
  const { getToken, isAuthenticated } = useFirebaseToken();
  const uid = user?.uid ?? "";

  const fetchPage = useCallback(
    async (pageParam: string | null, limit: number) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return feedApi.getFeed(token, pageParam ?? undefined, limit);
    },
    [getToken]
  );

  return useInfiniteQuery<
    GrowthFeedResult,
    Error,
    InfiniteData<GrowthFeedResult, string | null>,
    readonly [string, string],
    string | null
  >({
    queryKey: FEED_QUERY_KEY(uid),
    queryFn: ({ pageParam }) => fetchPage(pageParam, DEFAULT_PAGE_SIZE),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: isAuthenticated && !!uid,
    staleTime: 60_000,
  });
}