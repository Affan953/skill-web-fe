"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { useAuth } from "@/contexts/AuthContext";
import { usersApi } from "@/lib/api";
import type { User } from "@/types";

/** Query key for user profile data (used for reactive XP/level updates) */
export const USER_QUERY_KEY = ["user", "me"];

/**
 * Fetches user profile data reactively via React Query.
 * Falls back to AuthContext user for immediate initial data.
 */
export function useUserQuery() {
  const { getToken, isAuthenticated } = useFirebaseToken();
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();

  const userQuery = useQuery<User, Error>({
    queryKey: USER_QUERY_KEY,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return usersApi.getMe(token);
    },
    enabled: isAuthenticated,
    // Use authUser as placeholder data until the query resolves
    placeholderData: authUser ?? undefined,
    // Keep data fresh — stale time of 30s
    staleTime: 30_000,
  });

  const invalidateUser = () =>
    queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });

  // Prefer fresh query data, fall back to AuthContext state
  const user = userQuery.data ?? authUser;

  return {
    user,
    isLoading: userQuery.isLoading,
    invalidateUser,
  };
}
