"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  useConversation,
  useMarkConversationRead,
  useMessages,
} from "@/hooks/useConversations";
import { useAuth } from "@/contexts/AuthContext";
import { useMessagingSocket } from "@/contexts/MessagingSocketContext";
import Avatar from "@/components/Avatar";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import {
  EmptyConversation,
  MessagesSkeleton,
  MessagingError,
} from "./messagingStates";
import {
  daySeparatorLabel,
  isDifferentDay,
  startsNewMessageGroup,
} from "@/lib/messageTime";
import {
  findNewMessageIds,
  isNearBottom,
  isNearTop,
  nextUnseenCount,
  shouldShowJumpToLatest,
} from "@/lib/messagingPolling";
import { cn } from "@/lib/cn";

/** Slightly longer than the CSS animation, so the class survives it. */
const ENTER_ANIMATION_MS = 240;

/**
 * A conversation thread.
 *
 * The component never knows how messages arrive. It reads a list, a loading
 * flag and an error from `useMessages`, and that hook's transport is a socket as
 * of Phase 33 — the same query key a five second poll used to overwrite. Every
 * behaviour below (the entrance animation, the jump-to-latest badge, the unread
 * bookkeeping) is derived from "the list of ids changed", not from "a poll
 * returned", which is why swapping the transport needed no change here at all.
 *
 * The one thing the thread does own is *which* conversation is open: it tells the
 * socket provider, which uses it both to join the room and to decide whether an
 * arriving message should count as unread. A message that renders on screen is
 * read, so an open-and-visible thread must not increment its own badge.
 */
export function MessageThread({
  conversationId,
  onBack,
}: {
  conversationId: string;
  onBack?: () => void;
}) {
  const { user } = useAuth();
  const currentUid = user?.uid ?? "";
  const messaging = useMessagingSocket();

  const conversationQuery = useConversation(conversationId);
  const {
    messages,
    isLoading,
    isError,
    isRefetchError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(conversationId, { poll: true });
  const markRead = useMarkConversationRead();

  // Announce the open conversation for as long as this thread is mounted, which
  // is what makes the room join and the unread accounting correct. Keyed on the
  // id, so navigating between two conversations swaps the announcement rather
  // than leaving the provider holding the previous one.
  //
  // Keyed on the two callbacks rather than on the whole context value. The
  // provider rebuilds that value every time the connection status changes, so
  // depending on it made this effect re-run on each reconnect: it announced the
  // conversation again after announcing it away, which produced a leave/join
  // pair per status change for no reason. Both callbacks are stable, so this now
  // runs when the conversation changes and for no other reason — the provider
  // re-joins the room itself when the socket comes back.
  const { joinConversation, leaveConversation } = messaging ?? {};
  useEffect(() => {
    joinConversation?.(conversationId);
    return () => leaveConversation?.(conversationId);
  }, [joinConversation, leaveConversation, conversationId]);

  const conversation = conversationQuery.data;
  const otherUser = conversation?.otherUser;

  const scrollRef = useRef<HTMLDivElement>(null);
  // Captured before loading older messages so the viewport can be put back
  // exactly where the reader was, instead of jumping.
  const anchorRef = useRef<{ height: number; top: number } | null>(null);
  const loadingOlderRef = useRef(false);
  const atBottomRef = useRef(true);
  const previousIdsRef = useRef<string[]>([]);
  const markedNewestRef = useRef<string | null>(null);

  const [atBottom, setAtBottom] = useState(true);
  const [unseenCount, setUnseenCount] = useState(0);
  const [enteringIds, setEnteringIds] = useState<ReadonlySet<string>>(() => new Set());
  // Mirrors `unseenCount` for the scroll callback, which must not depend on
  // state it would otherwise have to re-subscribe to on every scroll event.
  const unseenRef = useRef(0);

  /** Changing id order is the only thing that may move the viewport. */
  const idsSignature = messages.map((message) => message.id).join("\u0001");

  const rows = useMemo(() => {
    const startsNewGroup = messages.map((message, index) => {
      const previous = index > 0 ? messages[index - 1] : null;
      return startsNewMessageGroup({
        isNewDay: isDifferentDay(previous?.createdAt, message.createdAt),
        sameSenderAsPrevious: !!previous && previous.senderId === message.senderId,
        gapMs: previous
          ? Math.max(
              0,
              new Date(message.createdAt).getTime() -
                new Date(previous.createdAt).getTime()
            )
          : 0,
      });
    });

    return messages.map((message, index) => {
      const previous = index > 0 ? messages[index - 1] : null;
      return {
        message,
        isGroupStart: startsNewGroup[index],
        // A group ends where the next message begins a new one.
        isGroupEnd:
          index === messages.length - 1 || startsNewGroup[index + 1],
        // The first message of a thread always carries the date, so an
        // all-today conversation still answers "when is this?".
        showDaySeparator:
          index === 0 || isDifferentDay(previous?.createdAt, message.createdAt),
        isMine: message.senderId === currentUid,
      };
    });
  }, [messages, currentUid]);

  /**
   * Applies everything that depends on "which messages are on screen now":
   * where the viewport sits, how many arrived unseen, and which of them get the
   * entrance animation. All three are decided from the id sequence, so a poll,
   * an optimistic send and a Phase 33 socket event are indistinguishable here.
   */
  useLayoutEffect(() => {
    const ids = idsSignature ? idsSignature.split("\u0001") : [];
    const previous = previousIdsRef.current;
    const isFirstPaint = previous.length === 0;
    previousIdsRef.current = ids;

    const newIds = findNewMessageIds(previous, ids);
    const el = scrollRef.current;

    // Older messages were prepended above the viewport: shift by exactly the
    // height that appeared so the same messages stay under the reader's eyes.
    if (anchorRef.current && el) {
      const delta = el.scrollHeight - anchorRef.current.height;
      el.scrollTop = anchorRef.current.top + delta;
      anchorRef.current = null;
      return;
    }

    if (newIds.length > 0) {
      setEnteringIds(new Set(newIds));
    }

    if (isFirstPaint) {
      // Opening a conversation lands on the newest message.
      if (el) el.scrollTop = el.scrollHeight;
      return;
    }

    const isMineId = (id: string) => {
      const match = messages.find((message) => message.id === id);
      return match ? match.senderId === currentUid : false;
    };
    const newIncomingCount = newIds.filter((id) => !isMineId(id)).length;
    const newest = ids[ids.length - 1] ?? null;
    const lastMessageIsMine = isMineId(newest ?? "");

    if (el && (atBottomRef.current || lastMessageIsMine)) {
      // Following the conversation, or replying: stay pinned to the newest.
      el.scrollTop = el.scrollHeight;
      unseenRef.current = 0;
      setUnseenCount(0);
    } else {
      // The reader scrolled up on purpose. Do not yank them back down; count
      // what they missed and let them choose to jump.
      const missed = nextUnseenCount({
        previousUnseen: unseenRef.current,
        newIncomingCount,
        isFollowingBottom: atBottomRef.current,
        isFirstPaint,
      });
      unseenRef.current = missed;
      setUnseenCount(missed);
    }

    /**
     * A new message that is already on screen is read, so it is marked read.
     * One that landed while the reader is up in the history is not.
     *
     * The ref keyed on the newest message keeps this to one request per arrival
     * batch, and makes StrictMode's double effect invocation a no-op.
     */
    if (newIncomingCount > 0 && atBottomRef.current) {
      if (markedNewestRef.current !== newest) {
        markedNewestRef.current = newest;
        markRead.mutate(conversationId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsSignature]);

  // Retire the entrance class once it has played, so a later re-render of the
  // same message does not replay the animation.
  useEffect(() => {
    if (enteringIds.size === 0) return;
    const timer = setTimeout(
      () => setEnteringIds(new Set()),
      ENTER_ANIMATION_MS + 40
    );
    return () => clearTimeout(timer);
  }, [enteringIds]);

  // Opening the conversation clears the viewer's unread badge.
  //
  // Gated on the conversation having actually loaded, for two reasons: firing
  // before the load would send a doomed request whenever the thread turns out
  // to be a 404 (a non-member, or a stale link), and firing on an already-read
  // conversation is a pointless round trip on every visit. Only a known
  // non-zero count is worth clearing.
  useEffect(() => {
    if (!conversation) return;
    if (conversation.unreadCount === 0) return;
    markRead.mutate(conversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, conversation?.unreadCount]);

  const handleLoadOlder = useCallback(() => {
    const el = scrollRef.current;
    if (loadingOlderRef.current) return;
    if (el) anchorRef.current = { height: el.scrollHeight, top: el.scrollTop };
    loadingOlderRef.current = true;
    void fetchNextPage().finally(() => {
      loadingOlderRef.current = false;
    });
  }, [fetchNextPage]);

  /**
   * Reaching the newest message means the reader has now seen whatever arrived
   * while they were away, so the conversation is marked read — the same as if
   * the message had never been missed. Deliberately not done for a message that
   * is still off screen, which is what keeps "read" honest.
   */
  const followLatest = useCallback(
    (markReadNow: boolean) => {
      const hadUnseen = unseenRef.current > 0;
      unseenRef.current = 0;
      setUnseenCount(0);
      if (markReadNow && hadUnseen) {
        markRead.mutate(conversationId);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversationId]
  );

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const metrics = {
      scrollHeight: el.scrollHeight,
      scrollTop: el.scrollTop,
      clientHeight: el.clientHeight,
    };

    const nearBottom = isNearBottom(metrics);
    if (nearBottom !== atBottomRef.current) {
      atBottomRef.current = nearBottom;
      setAtBottom(nearBottom);
      // Back at the bottom: anything that arrived is now on screen.
      if (nearBottom && unseenRef.current > 0) followLatest(true);
    }

    // Reaching the top pulls in the previous page.
    if (isNearTop(metrics) && hasNextPage) {
      handleLoadOlder();
    }
  }, [handleLoadOlder, hasNextPage, followLatest]);

  const scrollToLatest = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    atBottomRef.current = true;
    setAtBottom(true);
    followLatest(true);
  }, [followLatest]);

  const showJumpToLatest = shouldShowJumpToLatest({
    isNearBottom: atBottom,
    unseenCount,
    hasMessages: messages.length > 0,
  });

  // A background poll that failed keeps the thread usable: the messages already
  // on screen stay, and a quiet banner offers a retry.
  if (isError && messages.length === 0) {
    return (
      <MessagingError
        message={conversationQuery.isError ? "Couldn't load this conversation." : "Couldn't load messages."}
        onRetry={() => {
          void conversationQuery.refetch();
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50">
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white px-3 py-2.5 sm:px-4">
        {onBack && (
          <Link
            href="/messages"
            aria-label="Back to conversations"
            className="-ml-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </Link>
        )}

        {otherUser ? (
          <>
            <Avatar
              src={otherUser.photoUrl}
              name={otherUser.displayName}
              size={40}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {otherUser.displayName}
              </p>
              <Link
                href={`/users/${encodeURIComponent(otherUser.username)}`}
                className="truncate text-xs text-slate-500 transition-colors hover:text-[#2563EB] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              >
                @{otherUser.username}
              </Link>
            </div>

            <Link
              href={`/users/${encodeURIComponent(otherUser.username)}`}
              aria-label={`View ${otherUser.displayName}'s profile`}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="hidden sm:inline">Profile</span>
            </Link>
          </>
        ) : (
          <div className="flex flex-1 items-center gap-3" aria-hidden="true">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-200" />
            <div className="space-y-1.5">
              <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
              <div className="h-2.5 w-20 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        )}
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          data-testid="thread-scroll"
          className="h-full overflow-y-auto overscroll-contain px-3 py-4 sm:px-5"
        >
          {isLoading ? (
            <MessagesSkeleton />
          ) : (
            <>
              {isRefetchError && (
                <div
                  role="status"
                  className="mb-3 flex items-center justify-center"
                >
                  <button
                    type="button"
                    data-testid="messages-refresh-error"
                    onClick={() => void refetch()}
                    className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    Couldn&rsquo;t refresh — showing older messages. Tap to retry.
                  </button>
                </div>
              )}

              {messages.length === 0 ? (
                <EmptyConversation name={otherUser?.displayName ?? "them"} />
              ) : (
                <>
                  {/* Keyboard and screen-reader route to the same pagination the
                      scroll handler uses. */}
                  {hasNextPage && isFetchingNextPage && (
                    <p
                      className="mb-3 text-center text-xs text-slate-400"
                      role="status"
                    >
                      Loading older messages…
                    </p>
                  )}
                  {hasNextPage && !isFetchingNextPage && (
                    <div className="mb-3 flex justify-center">
                      <button
                        type="button"
                        onClick={handleLoadOlder}
                        className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                      >
                        Load earlier messages
                      </button>
                    </div>
                  )}

                  <ul className="space-y-0.5">
                    {rows.map((row) => (
                      <MessageBubble
                        key={row.message.id}
                        message={row.message}
                        isMine={row.isMine}
                        isGroupStart={row.isGroupStart}
                        isGroupEnd={row.isGroupEnd}
                        dayLabel={
                          row.showDaySeparator
                            ? daySeparatorLabel(row.message.createdAt)
                            : null
                        }
                        otherUser={otherUser}
                        entering={enteringIds.has(row.message.id)}
                      />
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>

        {showJumpToLatest && (
          <button
            type="button"
            data-testid="jump-to-latest"
            onClick={scrollToLatest}
            className={cn(
              "absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5",
              "rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-lg shadow-slate-900/10",
              "transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            )}
          >
            <svg
              className="h-3.5 w-3.5 text-[#2563EB]"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
              />
            </svg>
            {unseenCount > 1 ? `${unseenCount} new messages` : "New message"}
          </button>
        )}
      </div>

      <MessageComposer conversationId={conversationId} />

      {/* Only a genuinely unusable transport is worth saying out loud. A brief
          reconnect is not: sends fall back to REST and the user sees nothing
          wrong, so announcing it would be a lie about a problem that does not
          affect them. */}
      {messaging?.isDegraded && (
        <p
          role="status"
          className="shrink-0 border-t border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-[11px] font-medium text-amber-800"
        >
          {messaging.statusLabel}
        </p>
      )}
    </div>
  );
}
