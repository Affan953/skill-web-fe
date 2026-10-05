/**
 * Transport rules for Direct Messaging.
 *
 * This module is the single place that knows *how* message data arrives, and it
 * is pure on purpose. Phase 32.1 was REST + React Query + polling; Phase 33
 * replaced the polling with a socket while leaving every rule below — the
 * visibility policy, the cache merge, the scroll decisions — exactly where they
 * were, because none of them ever had to know which transport fed the cache.
 *
 * Framework-free so these rules can be reasoned about — and exercised — on their
 * own, instead of only through a mounted React tree.
 */

/**
 * How data reaches the cache.
 *
 * `realtime` is the Phase 33 transport: a socket writes new messages into the
 * same query keys a poll used to overwrite, so the components are identical in
 * both modes. `polling` is kept as an explicit, reachable value rather than
 * deleted, because it is the only way to tell a "no messages are arriving"
 * regression apart from "the socket is not connected" when diagnosing a
 * deployment.
 */
export const MESSAGING_TRANSPORT = {
  Realtime: "realtime",
  Polling: "polling",
} as const;

export type MessagingTransport =
  (typeof MESSAGING_TRANSPORT)[keyof typeof MESSAGING_TRANSPORT];

/** The transport this build ships. */
export const ACTIVE_MESSAGING_TRANSPORT: MessagingTransport =
  MESSAGING_TRANSPORT.Realtime;

/**
 * How often an OPEN conversation refetches its messages.
 *
 * Five seconds was the deliberate tradeoff for a REST transport: fast enough that
 * a reply felt like it arrived on its own, slow enough that one open thread was
 * one request every five seconds. Under the realtime transport this value is
 * unused — a socket delivers a message in milliseconds — but it stays defined
 * because it is the recovery budget: how long the UI may wait for REST
 * reconciliation after a reconnect before a missed message is visible.
 */
export const MESSAGE_POLL_INTERVAL_MS = 5_000;

/**
 * How often the conversation list refetches so unread badges stay roughly
 * fresh. Slower than the thread on purpose: the list is a summary, and it must
 * never be the reason a client talks to the server often. Under the realtime
 * transport the list is maintained by `message:new` instead.
 */
export const INBOX_POLL_INTERVAL_MS = 30_000;

/** How close to the bottom counts as "following the conversation". */
export const NEAR_BOTTOM_PX = 64;

/** How close to the top triggers loading older messages. */
export const NEAR_TOP_PX = 56;

/**
 * Namespace for optimistic messages that the server has not confirmed.
 *
 * Server ids are `c_<conversationId>_<uid>_<clientMessageId>`, so this prefix
 * can never collide with a real one. A pending bubble therefore cannot shadow a
 * server message, and a failed send can be rolled back by id without guessing.
 */
export const PENDING_MESSAGE_ID_PREFIX = "pending:";

export type PollInterval = number | false;

export interface ScrollMetrics {
  scrollHeight: number;
  scrollTop: number;
  clientHeight: number;
}

/**
 * The interval to hand a React Query observer.
 *
 * `false` means "no timer at all" rather than "a timer that skips its work", so
 * a hidden tab or an unmounted thread issues zero requests rather than waking
 * up to discard them.
 */
export function resolvePollInterval(input: {
  enabled: boolean;
  isVisible: boolean;
  interval: number;
}): PollInterval {
  if (!input.enabled) return false;
  if (!input.isVisible) return false;
  return input.interval;
}

/**
 * The interval for a query, given the active transport.
 *
 * The whole of Phase 33's polling removal is this one branch. Under `realtime`
 * there is no recurring fetch at all — the socket writes into the same cache
 * entry a poll would have overwritten — so a mounted thread and a mounted inbox
 * both cost zero requests, which is the whole point of the phase.
 *
 * The two conditions are kept separate on purpose. `false` is not merely
 * "disabled": it also means nothing wakes up on a timer, so a hidden tab cannot
 * burn requests it will throw away.
 */
export function resolveTransportPollInterval(input: {
  transport: MessagingTransport;
  enabled: boolean;
  isVisible: boolean;
  interval: number;
}): PollInterval {
  if (input.transport === MESSAGING_TRANSPORT.Realtime) return false;
  return resolvePollInterval(input);
}

/** Only a hidden -> visible edge is worth an immediate refetch. */
export function shouldRefetchOnVisibilityChange(
  wasVisible: boolean,
  isVisible: boolean
): boolean {
  return !wasVisible && isVisible;
}

export function isNearBottom(
  metrics: ScrollMetrics,
  threshold: number = NEAR_BOTTOM_PX
): boolean {
  return metrics.scrollHeight - metrics.scrollTop - metrics.clientHeight <= threshold;
}

export function isNearTop(metrics: ScrollMetrics, threshold: number = NEAR_TOP_PX) {
  return metrics.scrollTop <= threshold;
}

/**
 * Ids appended to the end of an oldest-first list since `previousIds`.
 *
 * The display order is oldest first, so anything genuinely new is a tail. An
 * empty previous list means "first paint", where nothing is new — otherwise
 * opening a long thread would animate every message it loads.
 */
export function findNewMessageIds(
  previousIds: readonly string[],
  nextIds: readonly string[]
): string[] {
  if (previousIds.length === 0) return [];

  const previousNewest = previousIds[previousIds.length - 1];
  const boundary = nextIds.indexOf(previousNewest);

  // The previously-newest message is still present: everything after it is new.
  if (boundary !== -1) return nextIds.slice(boundary + 1);

  // It is gone (an optimistic bubble was rolled back, or the window shifted).
  // Fall back to a set difference, which still cannot report a duplicate.
  const known = new Set(previousIds);
  return nextIds.filter((id) => !known.has(id));
}

/**
 * How many messages the reader has not seen because the view refused to scroll.
 *
 * Only counts incoming messages while the view is NOT following the bottom:
 * a message that is already on screen must never inflate the jump-to-latest
 * badge.
 */
export function nextUnseenCount(input: {
  previousUnseen: number;
  newIncomingCount: number;
  isFollowingBottom: boolean;
  isFirstPaint: boolean;
}): number {
  if (input.isFirstPaint) return 0;
  if (input.isFollowingBottom) return 0;
  return input.previousUnseen + input.newIncomingCount;
}

export function shouldShowJumpToLatest(input: {
  isNearBottom: boolean;
  unseenCount: number;
  hasMessages: boolean;
}): boolean {
  if (!input.hasMessages) return false;
  if (input.isNearBottom) return false;
  return input.unseenCount > 0;
}

export function pendingMessageId(clientMessageId: string): string {
  return `${PENDING_MESSAGE_ID_PREFIX}${clientMessageId}`;
}

export function isPendingMessageId(id: string): boolean {
  return id.startsWith(PENDING_MESSAGE_ID_PREFIX);
}

export function removeById<T extends { id: string }>(
  items: readonly T[],
  id: string
): T[] {
  return items.filter((item) => item.id !== id);
}

/**
 * Insert into a newest-first list at its chronological position.
 *
 * A bubble that only sorts correctly for the newest message can be out of order
 * the moment two sends overlap, and the thread would render them swapped.
 */
export function insertNewestFirst<T extends { createdAt: string | Date }>(
  items: readonly T[],
  item: T
): T[] {
  const at = new Date(item.createdAt).getTime();
  const result = items.slice();

  for (let index = 0; index < result.length; index += 1) {
    if (at > new Date(result[index].createdAt).getTime()) {
      result.splice(index, 0, item);
      return result;
    }
  }

  result.push(item);
  return result;
}

/** Total unread across the loaded conversations, for the nav badge. */
export function countTotalUnread(
  conversations: readonly { unreadCount: number }[]
): number {
  return conversations.reduce((total, conversation) => total + conversation.unreadCount, 0);
}
