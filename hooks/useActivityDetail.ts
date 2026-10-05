"use client";

import { useQuery } from "@tanstack/react-query";
import { activityApi } from "@/lib/api";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { useAuth } from "@/contexts/AuthContext";
import type { GrowthActivityDetail } from "@/types";

export const ACTIVITY_DETAIL_KEY = "activity-detail";
export const ACTIVITY_DETAIL_QUERY_KEY = (activityId: string) =>
  [ACTIVITY_DETAIL_KEY, activityId] as const;

/**
 * Resolves a single growth activity by document ID (the shareable page). The
 * backend enforces the privacy gate, so a private or missing activity simply
 * resolves to a 404 with no distinguishing information.
 */
export function useActivityDetail(activityId: string | null) {
  const { getToken, isAuthenticated } = useFirebaseToken();
  const { user } = useAuth();
  const uid = user?.uid ?? "";

  return useQuery<GrowthActivityDetail, Error>({
    // The uid is part of the key so switching accounts never shows the
    // previous viewer's cached activity (own-reaction differs per viewer).
    queryKey: [...ACTIVITY_DETAIL_QUERY_KEY(activityId ?? ""), uid],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      if (!activityId) throw new Error("Missing activity id");
      return activityApi.getActivity(activityId, token);
    },
    enabled: isAuthenticated && !!activityId,
    retry: false,
    staleTime: 60_000,
  });
}
