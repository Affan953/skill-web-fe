"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { activityApi, getUserFacingError } from "@/lib/api";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { useAuth } from "@/contexts/AuthContext";
import { setReactionStateEverywhere } from "@/lib/interactionCache";
import type { GrowthInteraction, GrowthReactionCounts, ReactionType } from "@/types";

export const ACTIVITY_REACTIONS_KEY = "activity-reactions";
export const ACTIVITY_REACTIONS_QUERY_KEY = (activityId: string, uid: string) =>
  [ACTIVITY_REACTIONS_KEY, activityId, uid] as const;

/** The reaction slice of an activity's interaction summary. */
export interface ActivityReactionState {
  counts: GrowthReactionCounts;
  currentUserReaction: ReactionType | null;
}

/** Moves one tally unit from `from` to `to`, never below zero. */
function adjust(
  counts: GrowthReactionCounts,
  from: ReactionType | null,
  to: ReactionType | null
): GrowthReactionCounts {
  const next = { ...counts };
  if (from) next[from] = Math.max(0, next[from] - 1);
  if (to) next[to] = next[to] + 1;
  return next;
}

function toState(
  summary: GrowthInteraction | undefined
): ActivityReactionState {
  return {
    counts: summary?.reactionCounts ?? {
      CELEBRATE: 0,
      ENCOURAGE: 0,
      SUPPORT: 0,
    },
    currentUserReaction: summary?.currentUserReaction ?? null,
  };
}

interface UseActivityReactionsOptions {
  /**
   * Summary already delivered with the feed item / activity detail. Used as the
   * query's initial data so the reaction bar renders instantly and costs no
   * extra request; the dedicated GET still runs once that data goes stale.
   */
  seed?: GrowthInteraction;
}

/**
 * Reaction state for one activity, kept in sync with the growth feed and the
 * shareable activity page.
 *
 * Writes are optimistic: the pill flips immediately and the server's
 * authoritative counts replace it on success. On failure the previous state is
 * restored, so the UI can never settle on a lie.
 *
 * Comment counts deliberately live outside this hook — they are owned by the
 * feed / detail caches (see `bumpCommentCount`) so posting a comment updates
 * the counter without refetching reactions.
 */
export function useActivityReactions(
  activityId: string,
  options: UseActivityReactionsOptions = {}
) {
  const { getToken, isAuthenticated } = useFirebaseToken();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const viewerUid = user?.uid ?? "";

  const queryKey = ACTIVITY_REACTIONS_QUERY_KEY(activityId, viewerUid);

  const query = useQuery<ActivityReactionState, Error>({
    queryKey,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const result = await activityApi.getReactions(activityId, token);
      return { counts: result.counts, currentUserReaction: result.currentUserReaction };
    },
    initialData: options.seed ? toState(options.seed) : undefined,
    enabled: isAuthenticated && !!activityId,
    staleTime: 60_000,
  });

  const commit = useCallback(
    (next: ActivityReactionState) => {
      queryClient.setQueryData(queryKey, next);
      setReactionStateEverywhere(
        queryClient,
        viewerUid,
        activityId,
        next.counts,
        next.currentUserReaction
      );
    },
    [queryClient, queryKey, viewerUid, activityId]
  );

  const mutation = useMutation<
    { counts: GrowthReactionCounts; currentUserReaction: ReactionType | null },
    Error,
    { optimistic: ActivityReactionState; rollback: ActivityReactionState },
    { previous: ActivityReactionState | undefined }
  >({
    mutationFn: async ({ optimistic }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      if (optimistic.currentUserReaction === null) {
        const result = await activityApi.removeReaction(activityId, token);
        return {
          counts: result.counts,
          // Removing always leaves the viewer without a reaction.
          currentUserReaction: null,
        };
      }
      return activityApi.setReaction(
        activityId,
        token,
        optimistic.currentUserReaction
      );
    },
    onMutate: async ({ optimistic, rollback }) => {
      await queryClient.cancelQueries({ queryKey });
      commit(optimistic);
      return { previous: rollback };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) commit(context.previous);
    },
    onSuccess: (result) => {
      commit({ counts: result.counts, currentUserReaction: result.currentUserReaction });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const state = query.data ?? mutation.variables?.optimistic ?? toState(options.seed);

  /**
   * Sets the viewer's reaction, or clears it when `type` is already theirs.
   * One reaction per user per activity, enforced server-side as well.
   */
  const toggle = useCallback(
    (type: ReactionType) => {
      const previous = state;
      const next: ActivityReactionState = {
        counts: adjust(previous.counts, previous.currentUserReaction, type),
        currentUserReaction: previous.currentUserReaction === type ? null : type,
      };
      mutation.mutate({ optimistic: next, rollback: previous });
    },
    [state, mutation]
  );

  return {
    counts: state.counts,
    currentUserReaction: state.currentUserReaction,
    isLoading: query.isLoading && !options.seed,
    isMutating: mutation.isPending,
    error: mutation.isError ? getUserFacingError(mutation.error) : null,
    toggle,
  };
}
