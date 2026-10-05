"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { followsApi, getUserFacingError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { FEED_QUERY_KEY } from "@/hooks/useGrowthFeed";
import type {
  FollowStatusResult,
  FollowCountsResult,
  FollowActionResult,
} from "@/types";

export const FOLLOW_STATUS_KEY = "follow-status";
export const FOLLOW_COUNTS_KEY = "follow-counts";
export const FOLLOWERS_KEY = "followers";
export const FOLLOWING_KEY = "following";

export const FOLLOW_STATUS_QUERY_KEY = (userId: string) =>
  [FOLLOW_STATUS_KEY, userId] as const;
export const FOLLOW_COUNTS_QUERY_KEY = (userId: string) =>
  [FOLLOW_COUNTS_KEY, userId] as const;
export const FOLLOWERS_QUERY_KEY = (userId: string) =>
  [FOLLOWERS_KEY, userId] as const;
export const FOLLOWING_QUERY_KEY = (userId: string) =>
  [FOLLOWING_KEY, userId] as const;

interface UseFollowOptions {
  /**
   * When provided, the follow-status fetch is skipped and this value is used
   * as the initial state. List rows already receive `isFollowingByViewer`
   * server-side, so this avoids an extra request per row.
   */
  initialIsFollowing?: boolean | null;
  /** Whether to fetch + watch the target's follower/following counts. */
  includeCounts?: boolean;
}

/**
 * Manages the follow relationship with a target user:
 *   - follow status (fetched, or seeded via `initialIsFollowing`)
 *   - real follower/following counts (optional)
 *   - follow / unfollow mutations with cache reconciliation
 *
 * No global state is introduced — everything is scoped to React Query keys
 * per target user, so multiple FollowButtons / profile views stay consistent.
 */
export function useFollow(
  targetUserId: string | null,
  options: UseFollowOptions = {}
) {
  const { getToken, isAuthenticated } = useFirebaseToken();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const viewerUid = currentUser?.uid ?? null;
  const isSelf = !!targetUserId && viewerUid === targetUserId;

  // Local override for mutations when the status query is disabled
  // (list rows seeded via `initialIsFollowing`).
  const [localIsFollowing, setLocalIsFollowing] = useState<boolean | null>(
    null
  );

  const statusQuery = useQuery<FollowStatusResult, Error>({
    queryKey: FOLLOW_STATUS_QUERY_KEY(targetUserId ?? ""),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return followsApi.getFollowStatus(targetUserId!, token);
    },
    enabled:
      isAuthenticated &&
      !!targetUserId &&
      !isSelf &&
      options.initialIsFollowing === undefined,
    staleTime: 60_000,
  });

  const countsQuery = useQuery<FollowCountsResult, Error>({
    queryKey: FOLLOW_COUNTS_QUERY_KEY(targetUserId ?? ""),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return followsApi.getCounts(targetUserId!, token);
    },
    enabled: isAuthenticated && !!targetUserId && !!options.includeCounts,
    staleTime: 60_000,
  });

  const mutation = useMutation<FollowActionResult, Error, "follow" | "unfollow">(
    {
      mutationFn: async (action) => {
        const token = await getToken();
        if (!token) throw new Error("Not authenticated");
        if (!targetUserId) throw new Error("Missing target user");
        return action === "follow"
          ? followsApi.followUser(targetUserId, token)
          : followsApi.unfollowUser(targetUserId, token);
      },
      onSuccess: (data) => {
        setLocalIsFollowing(data.following);

        // Status is authoritative from the response.
        queryClient.setQueryData<FollowStatusResult>(
          FOLLOW_STATUS_QUERY_KEY(data.targetUserId),
          { isFollowing: data.following }
        );

        // Counts change on both sides of the edge — refetch so everything
        // is exact (they are pure Firestore aggregations, cheap to read).
        queryClient.invalidateQueries({
          queryKey: FOLLOW_COUNTS_QUERY_KEY(data.targetUserId),
        });
        // The actor just added/removed a row in the target's followers list.
        queryClient.invalidateQueries({
          queryKey: FOLLOWERS_QUERY_KEY(data.targetUserId),
        });
        if (viewerUid && viewerUid !== data.targetUserId) {
          queryClient.invalidateQueries({
            queryKey: FOLLOW_COUNTS_QUERY_KEY(viewerUid),
          });
          queryClient.invalidateQueries({
            queryKey: FOLLOWING_QUERY_KEY(viewerUid),
          });
          // The viewer's following set changed — their growth feed depends on
          // it, so the next visit reflects the new set of sources.
          queryClient.invalidateQueries({
            queryKey: FEED_QUERY_KEY(viewerUid),
          });
        }
      },
      onError: (error) => {
        // The backend rejected an out-of-sync action (e.g. a double-click or a
        // stale list row). Reconcile the real state instead of leaving a lie.
        if (
          targetUserId &&
          (error.message === "ALREADY_FOLLOWING" ||
            error.message === "NOT_FOLLOWING")
        ) {
          queryClient.invalidateQueries({
            queryKey: FOLLOW_STATUS_QUERY_KEY(targetUserId),
          });
          queryClient.invalidateQueries({
            queryKey: FOLLOW_COUNTS_QUERY_KEY(targetUserId),
          });
        }
      },
    }
  );

  const follow = useCallback(
    () => mutation.mutateAsync("follow"),
    [mutation]
  );
  const unfollow = useCallback(
    () => mutation.mutateAsync("unfollow"),
    [mutation]
  );

  const isFollowing = useMemo(() => {
    if (localIsFollowing !== null) return localIsFollowing;
    if (options.initialIsFollowing !== undefined)
      return options.initialIsFollowing;
    return statusQuery.data?.isFollowing ?? false;
  }, [
    localIsFollowing,
    options.initialIsFollowing,
    statusQuery.data?.isFollowing,
  ]);

  const isStatusLoading =
    options.initialIsFollowing !== undefined ? false : statusQuery.isLoading;

  const error = useMemo(() => {
    const err = mutation.isError
      ? mutation.error
      : statusQuery.isError
        ? statusQuery.error
        : null;
    return err ? getUserFacingError(err) : null;
  }, [mutation.isError, mutation.error, statusQuery.isError, statusQuery.error]);

  return {
    targetUserId,
    isSelf,
    isFollowing,
    isStatusLoading,
    isMutating: mutation.isPending,
    isPending: mutation.isPending || isStatusLoading,
    isCountsLoading: countsQuery.isLoading,
    counts: countsQuery.data,
    error,
    follow,
    unfollow,
    // The authoritative counts from the last successful mutation, if any.
    lastResult: mutation.data ?? null,
  };
}