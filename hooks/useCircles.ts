"use client";

import { useCallback, useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { circlesApi, getUserFacingError } from "@/lib/api";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { useAuth } from "@/contexts/AuthContext";
import type {
  CircleListResult,
  CircleMemberListResult,
  CircleMembershipResult,
  CreateCircleInput,
  GrowthCircle,
  UpdateCircleInput,
} from "@/types";

export const CIRCLE_DETAIL_KEY = "circle-detail";
export const CIRCLE_MEMBERS_KEY = "circle-members";

/** Prefix shared by every Discover query key, for targeted cache patches. */
const DISCOVER_CIRCLES_PREFIX = "discover-circles";

export const MY_CIRCLES_QUERY_KEY = ["my-circles"] as const;
export const DISCOVER_CIRCLES_QUERY_KEY = (topic: string, search: string) =>
  [DISCOVER_CIRCLES_PREFIX, topic, search] as const;
export const CIRCLE_DETAIL_QUERY_KEY = (circleId: string) =>
  [CIRCLE_DETAIL_KEY, circleId] as const;
export const CIRCLE_MEMBERS_QUERY_KEY = (circleId: string) =>
  [CIRCLE_MEMBERS_KEY, circleId] as const;

const DEFAULT_PAGE_SIZE = 20;

/**
 * Circles the viewer belongs to — circles they own plus groups they joined.
 *
 * Driven from the membership collection server-side, so this is one paginated
 * query rather than a per-circle lookup.
 */
export function useMyCircles() {
  const { getToken, isAuthenticated } = useFirebaseToken();

  return useInfiniteQuery<
    CircleListResult,
    Error,
    InfiniteData<CircleListResult, string | null>,
    typeof MY_CIRCLES_QUERY_KEY,
    string | null
  >({
    queryKey: MY_CIRCLES_QUERY_KEY,
    queryFn: async ({ pageParam }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return circlesApi.getMyCircles(token, pageParam ?? undefined, DEFAULT_PAGE_SIZE);
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export interface DiscoverCirclesFilters {
  topic?: string;
  search?: string;
}

/**
 * Discoverable PUBLIC circles.
 *
 * `topic` and `search` are part of the query key and are sent to the backend,
 * which applies them as Firestore equality / prefix filters. Typing in the
 * search box therefore never loads the collection into the browser.
 */
export function useDiscoverCircles(filters: DiscoverCirclesFilters = {}) {
  const { getToken, isAuthenticated } = useFirebaseToken();
  const topic = filters.topic?.trim() ?? "";
  const search = filters.search?.trim() ?? "";

  return useInfiniteQuery<
    CircleListResult,
    Error,
    InfiniteData<CircleListResult, string | null>,
    readonly [string, string, string],
    string | null
  >({
    queryKey: DISCOVER_CIRCLES_QUERY_KEY(topic, search),
    queryFn: async ({ pageParam }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return circlesApi.discoverCircles(token, {
        topic: topic || undefined,
        search: search || undefined,
        cursor: pageParam ?? undefined,
        limit: DEFAULT_PAGE_SIZE,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

/**
 * A single circle. A PRIVATE circle the viewer does not belong to answers 404,
 * exactly like a circle that does not exist, so this hook surfaces the same
 * "not found" state for both.
 */
export function useCircle(circleId: string | null) {
  const { getToken, isAuthenticated } = useFirebaseToken();

  return useQuery<GrowthCircle, Error>({
    queryKey: CIRCLE_DETAIL_QUERY_KEY(circleId ?? ""),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return circlesApi.getCircle(circleId!, token);
    },
    enabled: isAuthenticated && !!circleId,
    staleTime: 30_000,
  });
}

/** Members of a circle, oldest membership first. */
export function useCircleMembers(circleId: string | null) {
  const { getToken, isAuthenticated } = useFirebaseToken();

  return useInfiniteQuery<
    CircleMemberListResult,
    Error,
    InfiniteData<CircleMemberListResult, string | null>,
    readonly [string, string],
    string | null
  >({
    queryKey: CIRCLE_MEMBERS_QUERY_KEY(circleId ?? ""),
    queryFn: async ({ pageParam }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return circlesApi.getCircleMembers(
        circleId!,
        token,
        pageParam ?? undefined,
        DEFAULT_PAGE_SIZE
      );
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: isAuthenticated && !!circleId,
    staleTime: 30_000,
  });
}

/**
 * Every circle mutation (create, edit, join, leave, add, remove, role).
 *
 * Membership actions are handled optimistically-in-spirit but authoritatively:
 * the response carries the post-action `memberCount` and role read inside the
 * transaction, and that value is written straight into the cached circle. The
 * UI therefore reflects the server's truth rather than an optimistic guess
 * that could disagree with `memberCount`.
 */
export function useCircleActions() {
  const { getToken, isAuthenticated } = useFirebaseToken();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  /** Patches one circle's cached copy everywhere it appears. */
  const patchCachedCircle = useCallback(
    (circleId: string, patch: Partial<GrowthCircle>) => {
      queryClient.setQueryData<GrowthCircle>(
        CIRCLE_DETAIL_QUERY_KEY(circleId),
        (prev) => (prev ? { ...prev, ...patch } : prev)
      );

      // Both list views show the same circles; a membership or count change has
      // to be reflected in Discover (every filter combination) and in "My
      // Circles", so both key prefixes are patched rather than one.
      const patchPages = (
        prev: InfiniteData<CircleListResult, string | null> | undefined
      ) => {
        if (!prev) return prev;
        return {
          ...prev,
          pages: prev.pages.map((page) => ({
            ...page,
            items: page.items.map((circle) =>
              circle.id === circleId ? { ...circle, ...patch } : circle
            ),
          })),
        };
      };

      queryClient.setQueriesData<
        InfiniteData<CircleListResult, string | null>
      >({ queryKey: [DISCOVER_CIRCLES_PREFIX] }, patchPages);

      queryClient.setQueryData<
        InfiniteData<CircleListResult, string | null>
      >(MY_CIRCLES_QUERY_KEY, patchPages);
    },
    [queryClient]
  );

  /** Reconciles membership and count from an authoritative action result. */
  const applyMembershipResult = useCallback(
    (result: CircleMembershipResult) => {
      // Only the viewer's own role is knowable from this response. For someone
      // else's membership change we must leave `viewerRole` untouched rather
      // than overwriting it with `undefined`.
      const patch: Partial<GrowthCircle> = {
        memberCount: result.memberCount,
      };
      if (result.userId === user?.uid) {
        patch.viewerRole = result.role;
      }
      patchCachedCircle(result.circleId, patch);

      // The member roster changed in every direction, so refetch it.
      queryClient.invalidateQueries({
        queryKey: CIRCLE_MEMBERS_QUERY_KEY(result.circleId),
      });
      // A join/leave also changes whether this circle belongs in "My Circles".
      queryClient.invalidateQueries({ queryKey: MY_CIRCLES_QUERY_KEY });
    },
    [patchCachedCircle, queryClient, user?.uid]
  );

  const withToken = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");
    return token;
  }, [getToken]);

  const create = useMutation<GrowthCircle, Error, CreateCircleInput>({
    mutationFn: async (input) =>
      circlesApi.createCircle(input, await withToken()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_CIRCLES_QUERY_KEY });
    },
  });

  const update = useMutation<
    GrowthCircle,
    Error,
    { circleId: string; input: UpdateCircleInput }
  >({
    mutationFn: async ({ circleId, input }) =>
      circlesApi.updateCircle(circleId, input, await withToken()),
    onSuccess: (circle) => {
      patchCachedCircle(circle.id, {
        name: circle.name,
        description: circle.description,
        topic: circle.topic,
        visibility: circle.visibility,
      });
      // The discover index keys change on rename/re-topic, so the filtered
      // results must be refetched rather than patched.
      queryClient.invalidateQueries({
        queryKey: [DISCOVER_CIRCLES_PREFIX],
      });
    },
  });

  const join = useMutation<CircleMembershipResult, Error, string>({
    mutationFn: async (circleId) =>
      circlesApi.joinCircle(circleId, await withToken()),
    onSuccess: applyMembershipResult,
  });

  const leave = useMutation<CircleMembershipResult, Error, string>({
    mutationFn: async (circleId) =>
      circlesApi.leaveCircle(circleId, await withToken()),
    onSuccess: applyMembershipResult,
  });

  const addMember = useMutation<
    CircleMembershipResult,
    Error,
    { circleId: string; userId: string }
  >({
    mutationFn: async ({ circleId, userId }) =>
      circlesApi.addCircleMember(circleId, userId, await withToken()),
    onSuccess: applyMembershipResult,
  });

  const removeMember = useMutation<
    CircleMembershipResult,
    Error,
    { circleId: string; userId: string }
  >({
    mutationFn: async ({ circleId, userId }) =>
      circlesApi.removeCircleMember(circleId, userId, await withToken()),
    onSuccess: applyMembershipResult,
  });

  const setRole = useMutation<
    CircleMembershipResult,
    Error,
    { circleId: string; userId: string; role: "ADMIN" | "MEMBER" }
  >({
    mutationFn: async ({ circleId, userId, role }) =>
      circlesApi.setCircleMemberRole(circleId, userId, role, await withToken()),
    onSuccess: (result) => {
      // Only the roster reflects a role change.
      queryClient.invalidateQueries({
        queryKey: CIRCLE_MEMBERS_QUERY_KEY(result.circleId),
      });
    },
  });

  return useMemo(
    () => ({
      create,
      update,
      join,
      leave,
      addMember,
      removeMember,
      setRole,
      isMutating:
        create.isPending ||
        update.isPending ||
        join.isPending ||
        leave.isPending ||
        addMember.isPending ||
        removeMember.isPending ||
        setRole.isPending,
      error: (() => {
        const err =
          create.error ??
          update.error ??
          join.error ??
          leave.error ??
          addMember.error ??
          removeMember.error ??
          setRole.error;
        return err ? getUserFacingError(err) : null;
      })(),
      isAuthenticated,
    }),
    [
      create,
      update,
      join,
      leave,
      addMember,
      removeMember,
      setRole,
      isAuthenticated,
    ]
  );
}

/** Flattens an infinite circle list into a single array for rendering. */
export function flattenCirclePages(
  data: InfiniteData<CircleListResult, string | null> | undefined
): GrowthCircle[] {
  if (!data) return [];
  return data.pages.flatMap((page) => page.items);
}

/** Flattens an infinite member list into a single array for rendering. */
export function flattenMemberPages(
  data: InfiniteData<CircleMemberListResult, string | null> | undefined
) {
  if (!data) return [];
  return data.pages.flatMap((page) => page.items);
}