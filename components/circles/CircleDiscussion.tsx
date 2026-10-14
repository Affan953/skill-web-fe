"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  useCircleMessages,
  useDeleteCircleMessage,
  useMarkCircleRead,
} from "@/hooks/useCircleMessages";
import {
  flattenMemberPages,
  useCircleMembers,
} from "@/hooks/useCircles";
import { useAuth } from "@/contexts/AuthContext";
import { useMessagingSocket } from "@/contexts/MessagingSocketContext";
import { CircleMessageBubble } from "./CircleMessageBubble";
import { CircleComposer } from "./CircleComposer";
import { MessagesSkeleton, MessagingError } from "@/components/messaging/messagingStates";
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
 * A circle's discussion thread.
 *
 * The same shape as the DM thread â€” the provider's `activeCircleId` drives the
 * room join and unread accounting, and the entrance animation / jump-to-latest /
 * load-older behaviours are all derived from "the list of ids changed" so the
 * transport (socket first, REST fallback) never leaks in here. The differences
 * from a DM are the things a group chat needs:
 *
 * - identities come from the circle's membership roster, not from a single
 *   counterpart, and a sender with no resolved identity renders anonymously;
 * - a moderator (OWNER/ADMIN) can soft-delete any message, which renders as a
 *   muted notice in every member's thread;
 * - the unread boundary from the server is drawn as a divider so the reader sees
 *   exactly where the newer messages begin.
 */
export function CircleDiscussion({
  circleId,
  circleName,
  canModerate,
  onBack,
}: {
  circleId: string;
  circleName?: string;
  canModerate?: boolean;
  onBack?: () => void;
}) {
  const { user } = useAuth();
  const currentUid = user?.uid ?? "";
  const messaging = useMessagingSocket();

  const {
    messages,
    isLoading,
    isError,
    isRefetchError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    unreadCount,
    unreadFromId,
  } = useCircleMessages(circleId);
  const markRead = useMarkCircleRead(circleId);
  const deleteMessage = useDeleteCircleMessage(circleId);
  const membersQuery = useCircleMembers(circleId);

  // Identity is resolved from the membership roster the page is already showing.
  // Messages resolve their sender out of this map; the roster is paginated, so a
  // sender beyond the first page falls back to an anonymous slot rather than a
  // raw uid ever being rendered.
  const identityBySender = useMemo(() => {
    const map = new Map<string, { photoUrl: string | null; displayName: string }>();
    for (const member of flattenMemberPages(membersQuery.data)) {
      map.set(member.user.uid, {
        photoUrl: member.user.photoUrl,
        displayName:
          member.user.displayName || `@${member.user.username}`,
      });
    }
    return map;
  }, [membersQuery.data]);

  // Announce the open circle for as long as this thread is mounted, which is what
  // makes the room join correct. Same stable-callback reasoning as the DM thread:
  // not keyed on the whole context value, so a reconnect does not bounce the
  // room â€” the provider re-joins circles and conversations itself on reconnect.
  const { joinCircle, leaveCircle } = messaging ?? {};
  useEffect(() => {
    joinCircle?.(circleId);
    return () => leaveCircle?.(circleId);
  }, [joinCircle, leaveCircle, circleId]);

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

  // A moderator's pending removal for this exact message, for the button label.
  const removingId =
    deleteMessage.isPending ? deleteMessage.variables ?? null : null;

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

    // The server's "first message you have not seen", used as the divider seat.
    const unreadIndex = unreadFromId
      ? messages.findIndex((message) => message.id === unreadFromId)
      : -1;

    return messages.map((message, index) => {
      const previous = index > 0 ? messages[index - 1] : null;
      return {
        message,
        isGroupStart: startsNewGroup[index],
        // A group ends where the next message begins a new one.
        isGroupEnd:
          index === messages.length - 1 || startsNewGroup[index + 1],
        // The first message of a thread always carries the date, so an
        // all-today discussion still answers "when is this?".
        showDaySeparator:
          index === 0 || isDifferentDay(previous?.createdAt, message.createdAt),
        isMine: message.senderId === currentUid,
        showUnreadDivider: unreadIndex === index,
      };
    });
  }, [messages, currentUid, unreadFromId]);

  /**
   * Applies everything that depends on "which messages are on screen now":
   * where the viewport sits, how many arrived unseen, and which of them get the
   * entrance animation. Identical in spirit to the DM thread â€” all three are
   * decided from the id sequence, so a poll, an optimistic send and a socket
   * event are indistinguishable here.
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
      // Opening the discussion lands on the newest message.
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
      // Following the discussion, or replying: stay pinned to the newest.
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
        markRead.mutate();
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

  // Opening the discussion clears the viewer's unread state so the read marker
  // moves to the newest message â€” the equivalent of the DM thread clearing its
  // badge. Gated on a known non-zero count, so a 404 or an already-read circle
  // never sends a useless request.
  useEffect(() => {
    if (unreadCount <= 0) return;
    markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [circleId, unreadCount]);

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
   * while they were away, so the circle is marked read â€” the same as if the
   * message had never been missed.
   */
  const followLatest = useCallback(
    (markReadNow: boolean) => {
      const hadUnseen = unseenRef.current > 0;
      unseenRef.current = 0;
      setUnseenCount(0);
      if (markReadNow && hadUnseen) {
        markRead.mutate();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [circleId]
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

  // A background refetch that failed keeps the thread usable: the messages
  // already on screen stay, and a quiet banner offers a retry.
  if (isError && messages.length === 0) {
    return (
      <MessagingError
        message="Couldn't load this discussion."
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <section className="flex h-[30rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white px-4 py-2.5">
        <p className="text-sm font-semibold text-slate-900">
          Discussion{circleName ? ` in ${circleName}` : ""}
        </p>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="ml-auto rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            Hide
          </button>
        )}
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          data-testid="circle-thread-scroll"
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
                    onClick={() => void refetch()}
                    className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    Couldn&rsquo;t refresh â€” showing older messages. Tap to retry.
                  </button>
                </div>
              )}

              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="max-w-xs text-center text-sm text-slate-400">
                    No messages yet. Start the conversation â€” this circle is a
                    safe space to share wins and reach out for help.
                  </p>
                </div>
              ) : (
                <>
                  {hasNextPage && isFetchingNextPage && (
                    <p
                      className="mb-3 text-center text-xs text-slate-400"
                      role="status"
                    >
                      Loading older messagesâ€¦
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
                      <li key={`divider-${row.message.id}`}>
                        {row.showUnreadDivider && (
                          <p
                            data-testid="circle-unread-divider"
                            className="my-4 flex items-center gap-3 text-[11px] font-medium text-[#2563EB]"
                          >
                            <span className="h-px flex-1 bg-[#2563EB]/30" aria-hidden="true" />
                            {unreadCount > 1
                              ? `${unreadCount} new messages`
                              : "New message"}
                            <span className="h-px flex-1 bg-[#2563EB]/30" aria-hidden="true" />
                          </p>
                        )}
                      </li>
                    ))}
                    {rows.map((row) => (
                      <CircleMessageBubble
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
                        sender={
                          row.isMine
                            ? null
                            : identityBySender.get(row.message.senderId)
                        }
                        entering={enteringIds.has(row.message.id)}
                        canModerate={canModerate && !row.isMine}
                        isModerating={removingId === row.message.id}
                        onModerateDelete={
                          canModerate && !row.isMine
                            ? (messageId) => deleteMessage.mutate(messageId)
                            : undefined
                        }
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
            data-testid="circle-jump-to-latest"
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

      <CircleComposer circleId={circleId} />

      {messaging?.isDegraded && (
        <p
          role="status"
          className="shrink-0 border-t border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-[11px] font-medium text-amber-800"
        >
          {messaging.statusLabel}
        </p>
      )}
    </section>
  );
}
