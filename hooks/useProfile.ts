"use client";

import { useQuery } from "@tanstack/react-query";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { usersApi } from "@/lib/api";
import type { PublicProfile, SearchUserResult } from "@/types";

/** The backend refuses a prefix shorter than this, so the UI gates on it too. */
export const MIN_USER_SEARCH_LENGTH = 2;

/** Fetches another user's public profile by username (privacy-masked if private). */
export function usePublicProfileByUsername(username: string | null) {
  const { getToken, isAuthenticated } = useFirebaseToken();

  return useQuery<PublicProfile, Error>({
    queryKey: ["user-profile", username ?? ""],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return usersApi.getPublicProfileByUsername(username!, token);
    },
    enabled: isAuthenticated && !!username && username.length > 0,
    staleTime: 60_000,
  });
}

/**
 * Prepares what the user typed into something the backend can range over.
 *
 * A leading `@` is how people actually write a handle, so typing "@affan"
 * finds the same person as "affan". Stripping it here rather than in each
 * caller is what keeps that behaviour identical on every search surface.
 *
 * The value is also collapsed to a single-spaced, lowercased form so the React
 * Query key is stable — otherwise "Affan" and "affan " would be two cache
 * entries for one result set.
 */
export function normaliseUserSearchQuery(query: string): string {
  return query.trim().replace(/^@+/, "").trim().toLowerCase();
}

/**
 * Prefix search over usernames + display names.
 *
 * Server-side only: the browser never fetches the user collection and filters
 * it locally. Only runs once the query is at least 2 characters (backend
 * requirement), and the caller is expected to debounce the value it passes.
 */
export function useUserSearch(query: string) {
  const { getToken, isAuthenticated } = useFirebaseToken();
  const trimmed = normaliseUserSearchQuery(query);

  return useQuery<SearchUserResult[], Error>({
    queryKey: ["user-search", trimmed],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return usersApi.searchUsers(trimmed, token);
    },
    enabled: isAuthenticated && trimmed.length >= MIN_USER_SEARCH_LENGTH,
    staleTime: 30_000,
  });
}