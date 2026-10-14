"use client";

import { useEffect, useRef } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { circlesApi } from "@/lib/api";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { useAuth } from "@/contexts/AuthContext";
import { useMessagingSocket } from "@/contexts/MessagingSocketContext";
import { useDocumentVisibility } from "@/hooks/useDocumentVisibility";
import {
  ACTIVE_MESSAGING_TRANSPORT,
  MESSAGE_POLL_INTERVAL_MS,
  insertNewestFirst,
  pendingMessageId,
  removeById,
  resolveTransportPollInterval,
  shouldRefetchOnVisibilityChange,
  PENDING_MESSAGE_ID_PREFIX,
} from "@/lib/messagingPolling";
import {
  applyCircleMessageDeleted,
  buildOptimisticCircleMessage,
  mergeCircleMessageNewestFirst,
  sortCircleNewestFirst,
  type CircleMessageDeletedEvent,
} from "@/lib/messagingSocket";
import type {
  CircleMessage,
  CircleMessagePage,
  ThreadCircleMessage,
} from "@/types";

export const CIRCLE_MESSAGES_KEY = "circle-messages";

/**
 * Query keys are the contract Phase 37 socket writes into.
 *
 * They are exported so the messaging socket provider can call `setQueryData` on
 * exactly the same entries a mount of this discussion reads — a handler that
 * folds a `circle:message:new` into this key is all it takes for the message to
 * appear in the thread with no component changes at all.
 */
export const CIRCLE_MESSAGES_QUERY_KEY = (uid: string, circleId: string) =>
  [CIRCLE_MESSAGES_KEY, uid, circleId] as const;

/** Matches the backend's `DEFAULT_CIRCLE_MESSAGE_PAGE_SIZE`. */
const CIRCLE_MESSAGE_PAGE_SIZE = 30;

type MessagesData = InfiniteData<CircleMessagePage, string | null>;

/** Append/merge entries only into the newest (first) page; older pages are history. */
function writeNewest(
  data: MessagesData | undefined,
  circleId: string,
  mutate: (items: ThreadCircleMessage[]) => ThreadCircleMessage[]
): MessagesData | undefined {
  if (!data || data.pages.length === 0) return data;

  return {
    ...data,
    pages: data.pages.map((page, index) =>
      index === 0
        ? { ...page, items: mutate(page.items as ThreadCircleMessage[]) }
        : page
    ),
  };
}

/**
 * A circle's discussion.
 *
 * The API returns newest-first pages, so page 0 is the most recent slice and
 * each subsequent page is older. `messages` flattens that into the display order
 * a thread needs (oldest at the top, newest at the bottom) so callers never have
 * to reverse a nested array. `unreadCount` and `unreadFromId` are the viewer's
 * own read state, read off the newest page once.
 */
export function useCircleMessages(circleId: string | null) {
  const { user } = useAuth();
  const { getToken, isAuthenticated } = useFirebaseToken();
  const uid = user?.uid ?? "";
  const isVisible = useDocumentVisibility();

  const queryKey = CIRCLE_MESSAGES_QUERY_KEY(uid, circleId ?? "");

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      if (!circleId) throw new Error("Missing circle id");
      return circlesApi.getCircleMessages(
        circleId,
        token,
        pageParam ?? undefined,
        CIRCLE_MESSAGE_PAGE_SIZE
      );
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: isAuthenticated && !!uid && !!circleId,
    staleTime: 15_000,
    // Replaced by the socket, which writes into this exact key.
    refetchInterval: resolveTransportPollInterval({
      transport: ACTIVE_MESSAGING_TRANSPORT,
      enabled: isAuthenticated && !!uid && !!circleId,
      isVisible,
      interval: MESSAGE_POLL_INTERVAL_MS,
    }),
    refetchIntervalInBackground: false,
  });

  // One immediate refetch on a hidden -> visible edge; a browser can reap a
  // backgrounded socket without the library noticing, so a returning tab is when
  // a REST read is still worth one. Mirrors the DM thread's behaviour.
  const wasVisibleRef = useRef(isVisible);
  useEffect(() => {
    const wasVisible = wasVisibleRef.current;
    wasVisibleRef.current = isVisible;

    if (shouldRefetchOnVisibilityChange(wasVisible, isVisible) && circleId) {
      void query.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, circleId, queryKey]);

  const pages = query.data?.pages ?? [];

  const messages: ThreadCircleMessage[] = pages
    .flatMap((page) => page.items)
    .reverse();

  return {
    ...query,
    /** Oldest first, which is the order the thread renders. */
    messages,
    unreadCount: pages[0]?.unreadCount ?? 0,
    unreadFromId: pages[0]?.unreadFromId ?? null,
    oldestLoaded: pages.length > 0,
  };
}

/**
 * Send a Circle discussion message, with an optimistic bubble.
 *
 * The same three guarantees as `useSendMessage`: the pending id is
 * `pending:<clientMessageId>` so it can neither shadow nor duplicate a real
 * message; the idempotency key is reused on a retry so a lost response cannot
 * post the text twice; and success replaces exactly that bubble with the
 * server's version while failure removes it, surgically. The transport is the
 * same — socket first with a REST fallback on the same key.
 */
export function useSendCircleMessage(circleId: string | null) {
  const { getToken } = useFirebaseToken();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messaging = useMessagingSocket();
  const uid = user?.uid ?? "";

  return useMutation<
    CircleMessage,
    Error,
    { text: string; clientMessageId: string },
    { pendingId: string }
  >({
    mutationFn: async ({ text, clientMessageId }) => {
      if (!circleId) throw new Error("Missing circle id");

      if (messaging) {
        return messaging.sendCircleMessage({ circleId, text, clientMessageId });
      }

      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return circlesApi.sendCircleMessage(circleId, token, text, clientMessageId);
    },

    onMutate: async ({ text, clientMessageId }) => {
      if (!circleId) return { pendingId: pendingMessageId(clientMessageId) };

      const key = CIRCLE_MESSAGES_QUERY_KEY(uid, circleId);

      // A poll in flight would otherwise resolve after this insert and drop it.
      await queryClient.cancelQueries({ queryKey: key });

      const pendingId = pendingMessageId(clientMessageId);
      const now = new Date().toISOString();

      queryClient.setQueryData<MessagesData>(key, (old) =>
        writeNewest(old, circleId, (items) =>
          insertNewestFirst(items, {
            ...buildOptimisticCircleMessage({
              pendingId,
              circleId,
              currentUid: uid,
              text,
              clientMessageId,
              createdAt: now,
            }),
          })
        )
      );

      return { pendingId };
    },

    onError: (_error, _variables, context) => {
      // Roll back only the optimistic bubble. The typed text stays in the
      // composer, and the server's own data in this cache is left alone.
      if (!circleId || !context) return;
      queryClient.setQueryData<MessagesData>(
        CIRCLE_MESSAGES_QUERY_KEY(uid, circleId),
        (old) =>
          writeNewest(old, circleId, (items) => removeById(items, context.pendingId))
      );
    },

    onSuccess: (message, _variables, context) => {
      // Swap the pending bubble for the real one in a single cache write. The
      // gateway broadcasts before it answers the ack, so by the time `onSuccess`
      // runs the `circle:message:new` handler has usually already folded the
      // server copy in; going through `mergeCircleMessageNewestFirst` makes this
      // write idempotent by both the pending id and the server id, so the
      // optimistic bubble, the broadcast and this ack collapse to exactly one row.
      const clientMessageId = context?.pendingId?.startsWith(
        PENDING_MESSAGE_ID_PREFIX
      )
        ? context.pendingId.slice(PENDING_MESSAGE_ID_PREFIX.length)
        : undefined;

      queryClient.setQueryData<MessagesData>(
        CIRCLE_MESSAGES_QUERY_KEY(uid, message.circleId),
        (old) =>
          writeNewest(old, message.circleId, (items) =>
            sortCircleNewestFirst(
              mergeCircleMessageNewestFirst(items, message, {
                currentUid: uid,
                clientMessageId,
              })
            )
          )
      );

      queryClient.invalidateQueries({
        queryKey: CIRCLE_MESSAGES_QUERY_KEY(uid, message.circleId),
      });
    },
  });
}

/**
 * Clear the viewer's own unread state for a circle.
 *
 * Optimistic: the badge and the "new messages" divider drop immediately and roll
 * back if the request fails. A stale "3 unread" is more annoying than a brief
 * flicker, and opening the discussion is exactly when the viewer is looking at
 * the count it clears.
 */
export function useMarkCircleRead(circleId: string | null) {
  const { getToken } = useFirebaseToken();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const uid = user?.uid ?? "";

  return useMutation<void, Error, void, { previous?: MessagesData }>({
    mutationFn: async () => {
      if (!circleId) throw new Error("Missing circle id");
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await circlesApi.markCircleRead(circleId, token);
    },
      onMutate: async () => {
        if (!circleId) return { previous: undefined };
        await queryClient.cancelQueries({
          queryKey: CIRCLE_MESSAGES_QUERY_KEY(uid, circleId),
        });
        const previous = queryClient.getQueryData<MessagesData>(
          CIRCLE_MESSAGES_QUERY_KEY(uid, circleId)
        );
        queryClient.setQueryData<MessagesData>(
          CIRCLE_MESSAGES_QUERY_KEY(uid, circleId),
          (old) =>
            old
              ? {
                  ...old,
                  pages: old.pages.map((page, index) =>
                    index === 0
                      ? { ...page, unreadCount: 0, unreadFromId: null }
                      : page
                  ),
                }
              : old
        );
        return { previous };
      },
      onError: (_error, _variables, context) => {
        if (context?.previous) {
          queryClient.setQueryData(
            CIRCLE_MESSAGES_QUERY_KEY(uid, circleId ?? ""),
            context.previous
          );
        }
      },
      onSettled: () => {
        if (!circleId) return;
        queryClient.invalidateQueries({
          queryKey: CIRCLE_MESSAGES_QUERY_KEY(uid, circleId),
        });
      },
    }
  );
}

/**
 * Moderate a message out of a circle's discussion (OWNER/ADMIN only).
 *
 * The removal is applied to the cache immediately and idempotently — the soft
 * delete rewrites the row in place, and the `circle:message:deleted` broadcast
 * (which the moderator's own socket receives too) re-applies the same shape. A
 * failure refetches so the row is restored from the server.
 */
export function useDeleteCircleMessage(circleId: string | null) {
  const { getToken } = useFirebaseToken();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const uid = user?.uid ?? "";

  return useMutation<void, Error, string>({
    mutationFn: async (messageId: string) => {
      if (!circleId) throw new Error("Missing circle id");
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await circlesApi.deleteCircleMessage(circleId, messageId, token);
      const event: CircleMessageDeletedEvent = {
        circleId,
        messageId,
        deletedAt: new Date().toISOString(),
      };
      queryClient.setQueryData<MessagesData>(
        CIRCLE_MESSAGES_QUERY_KEY(uid, circleId),
        (old) => applyCircleMessageDeleted(old, event)
      );
    },
    onError: () => {
      if (!circleId) return;
      queryClient.invalidateQueries({
        queryKey: CIRCLE_MESSAGES_QUERY_KEY(uid, circleId),
      });
    },
  });
}