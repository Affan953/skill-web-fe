/**
 * React Query cache helpers for the activity interaction layer.
 *
 * A single activity's interaction state is cached in up to two places — the
 * viewer's growth feed (every page of the infinite query) and the shareable
 * activity detail — so mutations must write to both to stay consistent no
 * matter which surface the user came back to.
 */
import type { QueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { FEED_QUERY_KEY } from "@/hooks/useGrowthFeed";
import { ACTIVITY_DETAIL_QUERY_KEY } from "@/hooks/useActivityDetail";
import type {
  GrowthFeedResult,
  GrowthInteraction,
  GrowthActivityDetail,
} from "@/types";

type FeedCache = InfiniteData<GrowthFeedResult, string | null>;

function mapFeedInteraction(
  cache: FeedCache | undefined,
  activityId: string,
  update: (current: GrowthInteraction) => GrowthInteraction
): FeedCache | undefined {
  if (!cache) return cache;
  let touched = false;
  const pages = cache.pages.map((page) => {
    if (!page.items.some((item) => item.id === activityId)) return page;
    touched = true;
    return {
      ...page,
      items: page.items.map((item) =>
        item.id === activityId
          ? { ...item, interaction: update(item.interaction) }
          : item
      ),
    };
  });
  if (!touched) return cache;
  return { ...cache, pages };
}

/** Applies `update` to one activity's interaction summary in the feed cache. */
export function updateFeedInteraction(
  queryClient: QueryClient,
  uid: string,
  activityId: string,
  update: (current: GrowthInteraction) => GrowthInteraction
): void {
  if (!uid) return;
  const key = FEED_QUERY_KEY(uid);
  queryClient.setQueriesData<FeedCache>({ queryKey: key }, (cache) =>
    mapFeedInteraction(cache, activityId, update)
  );
}

/** Applies `update` to the cached shareable activity, if it is loaded. */
export function updateDetailInteraction(
  queryClient: QueryClient,
  uid: string,
  activityId: string,
  update: (current: GrowthInteraction) => GrowthInteraction
): void {
  if (!uid) return;
  queryClient.setQueriesData<GrowthActivityDetail>(
    { queryKey: ACTIVITY_DETAIL_QUERY_KEY(activityId) },
    (detail) =>
      detail && detail.id === activityId
        ? { ...detail, interaction: update(detail.interaction) }
        : detail
  );
}

/** Writes one activity's interaction summary into every cached surface. */
export function setInteractionEverywhere(
  queryClient: QueryClient,
  uid: string,
  activityId: string,
  next: GrowthInteraction
): void {
  const apply = () => next;
  updateFeedInteraction(queryClient, uid, activityId, apply);
  updateDetailInteraction(queryClient, uid, activityId, apply);
}

/**
 * Writes only the reaction slice, preserving the cached comment count. This is
 * the write path for reaction mutations, which must not disturb comments.
 */
export function setReactionStateEverywhere(
  queryClient: QueryClient,
  uid: string,
  activityId: string,
  reactionCounts: GrowthInteraction["reactionCounts"],
  currentUserReaction: GrowthInteraction["currentUserReaction"]
): void {
  const apply = (current: GrowthInteraction): GrowthInteraction => ({
    ...current,
    reactionCounts,
    currentUserReaction,
  });
  updateFeedInteraction(queryClient, uid, activityId, apply);
  updateDetailInteraction(queryClient, uid, activityId, apply);
}

/** Nudges the cached comment count after posting or deleting a comment. */
export function bumpCommentCount(
  queryClient: QueryClient,
  uid: string,
  activityId: string,
  delta: number
): void {
  const apply = (current: GrowthInteraction): GrowthInteraction => ({
    ...current,
    commentCount: Math.max(0, current.commentCount + delta),
  });
  updateFeedInteraction(queryClient, uid, activityId, apply);
  updateDetailInteraction(queryClient, uid, activityId, apply);
}
