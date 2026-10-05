"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { conversationsApi } from "@/lib/api";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { useAuth } from "@/contexts/AuthContext";
import { useMessagingSocket } from "@/contexts/MessagingSocketContext";
import { useDocumentVisibility } from "@/hooks/useDocumentVisibility";
import {
  ACTIVE_MESSAGING_TRANSPORT,
  INBOX_POLL_INTERVAL_MS,
  MESSAGE_POLL_INTERVAL_MS,
  countTotalUnread,
  insertNewestFirst,
  pendingMessageId,
  removeById,
  resolveTransportPollInterval,
  shouldRefetchOnVisibilityChange,
  PENDING_MESSAGE_ID_PREFIX,
} from "@/lib/messagingPolling";
import { mergeMessageNewestFirst, sortNewestFirst } from "@/lib/messagingSocket";
import type {
  Conversation,
  ConversationPage,
  Message,
  MessagePage,
  ThreadMessage,
} from "@/types";

export const CONVERSATIONS_KEY = "conversations";
export const CONVERSATION_KEY = "conversation";
export const MESSAGES_KEY = "messages";

/**
 * Query keys are the contract a Phase 33 socket writes into.
 *
 * They are exported so a future transport can call `setQueryData` on exactly the
 * same entries a poll currently overwrites, and a handler that appends a message
 * here is enough to make it appear in the thread, the list preview and the
 * unread counts with no component changes at all.
 */
export const CONVERSATIONS_QUERY_KEY = (uid: string) =>
  [CONVERSATIONS_KEY, uid] as const;
export const CONVERSATION_QUERY_KEY = (uid: string, conversationId: string) =>
  [CONVERSATION_KEY, uid, conversationId] as const;
export const MESSAGES_QUERY_KEY = (uid: string, conversationId: string) =>
  [MESSAGES_KEY, uid, conversationId] as const;

const CONVERSATION_PAGE_SIZE = 20;
const MESSAGE_PAGE_SIZE = 20;

type MessagesData = InfiniteData<MessagePage, string | null>;

function writeNewest(
  data: MessagesData | undefined,
  conversationId: string,
  mutate: (items: ThreadMessage[]) => ThreadMessage[]
): MessagesData | undefined {
  if (!data || data.pages.length === 0) return data;

  return {
    ...data,
    pages: data.pages.map((page, index) =>
      // Only the newest page is appended to; older pages are history.
      index === 0
        ? { ...page, items: mutate(page.items as ThreadMessage[]) }
        : page
    ),
  };
}

/**
 * The authenticated user's conversation list, newest first.
 *
 * The list is maintained by `message:new` over the socket, so it mounts with no
 * recurring fetch. `enabled` lets a component that only wants to read the total
 * (the sidebar badge) share this cache without being the reason the list is
 * fetched on pages that never show it.
 */
export function useConversations(options: { enabled?: boolean } = {}) {
  const { user } = useAuth();
  const { getToken, isAuthenticated } = useFirebaseToken();
  const uid = user?.uid ?? "";
  const isVisible = useDocumentVisibility();

  const enabled = options.enabled ?? true;

  const fetchPage = useCallback(
    async (pageParam: string | null) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return conversationsApi.list(
        token,
        pageParam ?? undefined,
        CONVERSATION_PAGE_SIZE
      );
    },
    [getToken]
  );

  // No explicit generics: v5 infers TQueryFnData = ConversationPage and wraps it
  // into InfiniteData itself. Passing a single type argument here would be read
  // as TQueryFnData and mis-select the initialData overloads.
  return useInfiniteQuery({
    queryKey: CONVERSATIONS_QUERY_KEY(uid),
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: enabled && isAuthenticated && !!uid,
    staleTime: 15_000,
    // Replaced by the socket. The unread badge and the last-message preview are
    // written directly by the `message:new` handler.
    refetchInterval: resolveTransportPollInterval({
      transport: ACTIVE_MESSAGING_TRANSPORT,
      enabled: enabled && isAuthenticated && !!uid,
      isVisible,
      interval: INBOX_POLL_INTERVAL_MS,
    }),
    refetchIntervalInBackground: false,
  });
}

/** One conversation. Used by the thread header. */
export function useConversation(conversationId: string | null) {
  const { user } = useAuth();
  const { getToken, isAuthenticated } = useFirebaseToken();
  const uid = user?.uid ?? "";

  return useQuery<Conversation>({
    queryKey: CONVERSATION_QUERY_KEY(uid, conversationId ?? ""),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      if (!conversationId) throw new Error("Missing conversation id");
      return conversationsApi.get(conversationId, token);
    },
    enabled: isAuthenticated && !!uid && !!conversationId,
    staleTime: 30_000,
  });
}

/**
 * Create-or-get a conversation with another user.
 *
 * Safe to call repeatedly (e.g. double-clicked profile button): the backend
 * conversation id is deterministic, so every call resolves to the same
 * conversation and there is never a duplicate.
 */
export function useCreateConversation() {
  const { getToken } = useFirebaseToken();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const uid = user?.uid ?? "";

  return useMutation<Conversation, Error, string>({
    mutationFn: async (targetUserId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return conversationsApi.create(token, targetUserId);
    },
    onSuccess: (conversation) => {
      // Targeted updates only — the inbox, this conversation, and its messages.
      // No global invalidation, so opening a chat never refetches the feed.
      queryClient.setQueryData<InfiniteData<ConversationPage, string | null>>(
        CONVERSATIONS_QUERY_KEY(uid),
        (old) => {
          if (!old) return old;
          const withoutIt = old.pages.map((page) => ({
            ...page,
            items: page.items.filter((c) => c.id !== conversation.id),
          }));
          return {
            ...old,
            pages: [
              { ...old.pages[0], items: [conversation, ...old.pages[0].items] },
              ...withoutIt.slice(1),
            ],
          };
        }
      );
      queryClient.setQueryData(
        CONVERSATION_QUERY_KEY(uid, conversation.id),
        conversation
      );
    },
  });
}

/**
 * Messages in a conversation.
 *
 * The API returns newest-first pages, so page 0 is the most recent slice and
 * each subsequent page is older. `messages` flattens that into the display
 * order a chat UI needs (oldest at the top, newest at the bottom) so callers
 * never have to reverse a nested array.
 *
 * `poll` records what Phase 32.1 needed. Under the realtime transport the value
 * no longer schedules anything — it only decides whether the visibility edge
 * below refetches — and the thread still passes it, so nothing about this hook's
 * contract changed for its callers.
 */
export function useMessages(
  conversationId: string | null,
  options: { poll?: boolean } = {}
) {
  const { user } = useAuth();
  const { getToken, isAuthenticated } = useFirebaseToken();
  const uid = user?.uid ?? "";
  const isVisible = useDocumentVisibility();
  const pollEnabled = (options.poll ?? false) && !!conversationId;

  const queryKey = MESSAGES_QUERY_KEY(uid, conversationId ?? "");

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      if (!conversationId) throw new Error("Missing conversation id");
      return conversationsApi.listMessages(
        conversationId,
        token,
        pageParam ?? undefined,
        MESSAGE_PAGE_SIZE
      );
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: isAuthenticated && !!uid && !!conversationId,
    staleTime: 15_000,
    // Replaced by the socket, which writes into this exact key.
    refetchInterval: resolveTransportPollInterval({
      transport: ACTIVE_MESSAGING_TRANSPORT,
      enabled: pollEnabled && isAuthenticated && !!uid,
      isVisible,
      interval: MESSAGE_POLL_INTERVAL_MS,
    }),
    refetchIntervalInBackground: false,
  });

  /**
   * One immediate refetch when the tab comes back.
   *
   * React Query's own `refetchIntervalInBackground` only *skips* ticks while
   * hidden, so a returning tab would otherwise wait out a whole interval with
   * visibly stale messages. A single refetch on the edge gives fresh state
   * without a storm of one.
   *
   * This survives the transport swap deliberately: a socket can be reaped by the
   * browser while a tab is backgrounded without the library ever noticing, so a
   * hidden → visible edge is exactly when a REST read is still worth one.
   *
   * The ref makes the edge fire exactly once even under StrictMode's double
   * effect invocation, and it is a hidden -> visible comparison rather than a
   * boolean dependency, so a re-render with the same visibility cannot trigger
   * a second request.
   */
  const wasVisibleRef = useRef(isVisible);
  useEffect(() => {
    const wasVisible = wasVisibleRef.current;
    wasVisibleRef.current = isVisible;

    if (shouldRefetchOnVisibilityChange(wasVisible, isVisible) && pollEnabled) {
      void query.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, pollEnabled, queryKey]);

  const pages = query.data?.pages ?? [];

  // The API returns newest-first per page, and page 0 is the newest page.
  // Reversing the flattened list therefore yields oldest-first, which is the
  // order a chat thread renders. flatMap already allocates a fresh array, so
  // the reverse cannot mutate the cached page data.
  const messages: ThreadMessage[] = pages
    .flatMap((page) => page.items)
    .reverse();

  return {
    ...query,
    /** Oldest first, which is the order the thread renders. */
    messages,
    oldestLoaded: pages.length > 0,
  };
}

interface SendContext {
  pendingId: string;
}

/**
 * Send a text message, with an optimistic bubble.
 *
 * The optimistic copy is safe because of three things working together:
 *
 *  - its id is namespaced `pending:<clientMessageId>`, which no server id can
 *    ever equal, so it can neither shadow nor duplicate a real message;
 *  - the same `clientMessageId` is sent on both transports, so if the response
 *    was merely lost, a retry collapses onto the message that already exists
 *    instead of posting the text twice;
 *  - success replaces the pending bubble in place with the server's version and
 *    failure removes exactly that one bubble, surgically, so a message that
 *    arrived over the socket mid-flight is never rolled back with it.
 *
 * Phase 33 moved the transport: `MessagingSocketProvider.sendMessage` tries the
 * socket and falls back to REST with this same `clientMessageId`, so this hook
 * cannot tell which one answered and does not need to. When there is no provider
 * — a route outside the authenticated shell — it goes straight to REST.
 *
 * The server stays the source of truth: success also invalidates so a drift in
 * ordering or unread accounting reconciles to whatever the backend considers
 * correct.
 */
export function useSendMessage(conversationId: string | null) {
  const { getToken } = useFirebaseToken();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messaging = useMessagingSocket();
  const uid = user?.uid ?? "";

  return useMutation<
    Message,
    Error,
    { text: string; clientMessageId: string },
    SendContext
  >({
    mutationFn: async ({ text, clientMessageId }) => {
      if (!conversationId) throw new Error("Missing conversation id");

      if (messaging) {
        return messaging.sendMessage({
          conversationId,
          text,
          clientMessageId,
        });
      }

      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return conversationsApi.sendMessage(
        conversationId,
        token,
        text,
        clientMessageId
      );
    },

    onMutate: async ({ text, clientMessageId }) => {
      if (!conversationId) return { pendingId: pendingMessageId(clientMessageId) };

      const key = MESSAGES_QUERY_KEY(uid, conversationId);

      // A poll in flight would otherwise resolve after this insert and drop it.
      await queryClient.cancelQueries({ queryKey: key });

      const pendingId = pendingMessageId(clientMessageId);
      const now = new Date().toISOString();
      const otherUser = queryClient.getQueryData<Conversation>(
        CONVERSATION_QUERY_KEY(uid, conversationId)
      )?.otherUser.uid;

      queryClient.setQueryData<MessagesData>(key, (old) =>
        writeNewest(old, conversationId, (items) =>
          insertNewestFirst(items, {
            id: pendingId,
            conversationId,
            senderId: uid,
            recipientId: otherUser ?? "",
            text,
            createdAt: now,
            updatedAt: now,
            pending: true,
            clientMessageId,
          })
        )
      );

      return { pendingId };
    },

    onError: (_error, _variables, context) => {
      // Roll back only the optimistic bubble. The typed text stays in the
      // composer, and the server's own data in this cache is left alone.
      if (!conversationId || !context) return;
      queryClient.setQueryData<MessagesData>(
        MESSAGES_QUERY_KEY(uid, conversationId),
        (old) => writeNewest(old, conversationId, (items) => removeById(items, context.pendingId))
      );
    },

    onSuccess: (message, _variables, context) => {
      // Swap the pending bubble for the real one in a single cache write, so the
      // message never blinks out and back between the two.
      //
      // The gateway broadcasts the committed message *before* it answers this
      // ack, so by the time `onSuccess` runs the `message:new` handler has
      // usually already folded the server copy in. Inserting blindly here would
      // therefore put a second copy of the same id in the thread. Going through
      // `mergeMessageNewestFirst` makes this write idempotent by both the
      // pending id and the server id, so the optimistic bubble, the broadcast
      // and this ack collapse to exactly one row whichever order they land in.
      const clientMessageId = context?.pendingId?.startsWith(
        PENDING_MESSAGE_ID_PREFIX
      )
        ? context.pendingId.slice(PENDING_MESSAGE_ID_PREFIX.length)
        : undefined;

      queryClient.setQueryData<MessagesData>(
        MESSAGES_QUERY_KEY(uid, message.conversationId),
        (old) =>
          writeNewest(old, message.conversationId, (items) =>
            sortNewestFirst(
              mergeMessageNewestFirst(items, message, {
                currentUid: uid,
                clientMessageId,
              })
            )
          )
      );

      queryClient.invalidateQueries({
        queryKey: MESSAGES_QUERY_KEY(uid, message.conversationId),
      });
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY(uid) });
      queryClient.invalidateQueries({
        queryKey: CONVERSATION_QUERY_KEY(uid, message.conversationId),
      });
    },
  });
}

/**
 * Clear the viewer's unread count for a conversation.
 *
 * Optimistic: the badge drops immediately and rolls back if the request fails,
 * because a stale "3 unread" is more annoying than a brief flicker.
 */
export function useMarkConversationRead() {
  const { getToken } = useFirebaseToken();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const uid = user?.uid ?? "";

  // TContext carries the optimistic-update snapshot so a failed mark-read can
  // put the previous unread counts back instead of leaving a false "all read".
  return useMutation<
    Conversation,
    Error,
    string,
    { previous?: InfiniteData<ConversationPage, string | null> }
  >({
    mutationFn: async (conversationId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return conversationsApi.markRead(conversationId, token);
    },
    onMutate: async (conversationId: string) => {
      await queryClient.cancelQueries({
        queryKey: CONVERSATIONS_QUERY_KEY(uid),
      });
      const previous = queryClient.getQueryData<
        InfiniteData<ConversationPage, string | null>
      >(CONVERSATIONS_QUERY_KEY(uid));
      queryClient.setQueryData<
        InfiniteData<ConversationPage, string | null>
      >(CONVERSATIONS_QUERY_KEY(uid), (old) =>
        old
          ? {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.map((c) =>
                  c.id === conversationId ? { ...c, unreadCount: 0 } : c
                ),
              })),
            }
          : old
      );
      return { previous };
    },
    onError: (_error, _conversationId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          CONVERSATIONS_QUERY_KEY(uid),
          context.previous
        );
      }
    },
    onSettled: (_data, _error, conversationId) => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY(uid) });
      queryClient.invalidateQueries({
        queryKey: CONVERSATION_QUERY_KEY(uid, conversationId),
      });
    },
  });
}

/**
 * Total unread messages, for the navigation badge.
 *
 * Backed by the real `unreadCount` the server computes per participant, and
 * read from the same cache entry the inbox itself uses, so showing it costs no
 * extra request. The observer is enabled only while a messages route is mounted;
 * elsewhere the sidebar shows no badge rather than a number that quietly went
 * stale, which would be worse than no number at all.
 */
export function useInboxUnreadCount(options: { enabled: boolean }) {
  const { data } = useConversations({ enabled: options.enabled });

  return countTotalUnread(
    data?.pages.flatMap((page) => page.items) ?? []
  );
}
