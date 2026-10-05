"use client";

import { useCallback } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { activityApi, getUserFacingError } from "@/lib/api";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { useAuth } from "@/contexts/AuthContext";
import { bumpCommentCount } from "@/lib/interactionCache";
import type { ActivityComment, CommentListResult } from "@/types";

export const ACTIVITY_COMMENTS_KEY = "activity-comments";
export const ACTIVITY_COMMENTS_QUERY_KEY = (activityId: string, uid: string) =>
  [ACTIVITY_COMMENTS_KEY, activityId, uid] as const;

const DEFAULT_PAGE_SIZE = 10;

/**
 * Cursor-paginated support comments for one activity, newest first, plus the
 * post/delete mutations.
 *
 * The acting user is always resolved from the bearer token server-side, so
 * there is no author field to send. Deletes are restricted to the comment
 * author by the backend; the UI only offers the control on own comments.
 */
export function useActivityComments(activityId: string, enabled = true) {
  const { getToken, isAuthenticated } = useFirebaseToken();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const viewerUid = user?.uid ?? "";

  const queryKey = ACTIVITY_COMMENTS_QUERY_KEY(activityId, viewerUid);

  const query = useInfiniteQuery<
    CommentListResult,
    Error,
    InfiniteData<CommentListResult, string | null>,
    readonly [string, string, string],
    string | null
  >({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return activityApi.getComments(
        activityId,
        token,
        pageParam ?? undefined,
        DEFAULT_PAGE_SIZE
      );
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: isAuthenticated && !!activityId && enabled,
    staleTime: 30_000,
  });

  const createMutation = useMutation<ActivityComment, Error, string>({
    mutationFn: async (content) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return activityApi.createComment(activityId, token, content);
    },
    // A new comment is the newest, so it belongs at the top of page one.
    onSuccess: (comment) => {
      queryClient.setQueryData<InfiniteData<CommentListResult, string | null>>(
        queryKey,
        (cache) => {
          if (!cache) return cache;
          const [first, ...rest] = cache.pages;
          if (!first) return cache;
          return {
            ...cache,
            pages: [
              {
                ...first,
                items: [comment, ...first.items.filter((c) => c.id !== comment.id)],
              },
              ...rest,
            ],
          };
        }
      );
      bumpCommentCount(queryClient, viewerUid, activityId, 1);
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (commentId) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await activityApi.deleteComment(activityId, commentId, token);
    },
    onSuccess: (_data, commentId) => {
      queryClient.setQueryData<InfiniteData<CommentListResult, string | null>>(
        queryKey,
        (cache) => {
          if (!cache) return cache;
          return {
            ...cache,
            pages: cache.pages.map((page) => ({
              ...page,
              items: page.items.filter((c) => c.id !== commentId),
            })),
          };
        }
      );
      bumpCommentCount(queryClient, viewerUid, activityId, -1);
      // A page may now hold fewer than `limit` items with more behind it.
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const addComment = useCallback(
    (content: string) => createMutation.mutateAsync(content),
    [createMutation]
  );

  const deleteComment = useCallback(
    (commentId: string) => deleteMutation.mutateAsync(commentId),
    [deleteMutation]
  );

  const comments = query.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    comments,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.isError ? getUserFacingError(query.error) : null,
    hasMore: query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    loadMore: query.fetchNextPage,
    addComment,
    isPosting: createMutation.isPending,
    postError: createMutation.isError
      ? getUserFacingError(createMutation.error)
      : null,
    deleteComment,
    deletingCommentId: deleteMutation.isPending ? deleteMutation.variables : null,
    deleteError: deleteMutation.isError
      ? getUserFacingError(deleteMutation.error)
      : null,
  };
}
