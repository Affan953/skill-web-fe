/**
 * Phase 33 — realtime messaging transport.
 *
 * This module is the frontend mirror of the backend's `messaging-events.ts`: it
 * owns the socket vocabulary, the cache-merge rules, and the send-fallback
 * policy. Like `messagingPolling.ts` it is pure and framework-free on purpose, so
 * the rules that matter can be reasoned about — and exercised — without a mounted
 * React tree or a live socket.
 *
 * The rule the whole design hangs on: **the socket is an accelerator, never the
 * source of truth.** Every function here is about writing a message the REST API
 * already owns into the React Query cache faster than a poll would. A client
 * that never opened a socket would behave identically, just slower, because
 * `useSendMessage` falls back to REST and every thread is still readable with
 * `GET /conversations/:id/messages`.
 */

import { io, type Socket } from "socket.io-client";
import type {
  CircleMessage,
  CircleMessagePage,
  ConversationPage,
  Message,
  MessagePage,
  ThreadCircleMessage,
  ThreadMessage,
} from "@/types";
import {
  PENDING_MESSAGE_ID_PREFIX,
  insertNewestFirst,
  pendingMessageId,
  removeById,
} from "@/lib/messagingPolling";

// ─────────────────────────────────────────────────────────────────────────────
// Wire contract
//
// Mirrors `skill-be/src/messages/messaging-events.ts`. The two files are written
// down separately on purpose — a shared package would be the better long-term
// home, but a client bundle must not import server code — so the event names and
// codes are asserted against the backend's own tests rather than shared.
// ─────────────────────────────────────────────────────────────────────────────

/** Must match `MESSAGING_NAMESPACE` on the server. */
export const MESSAGING_NAMESPACE = "/messaging";

export const MESSAGING_EVENTS = {
  JoinConversation: "conversation:join",
  JoinedConversation: "conversation:joined",
  LeaveConversation: "conversation:leave",
  LeftConversation: "conversation:left",
  SendMessage: "message:send",
  NewMessage: "message:new",
  AckMessage: "message:ack",
  ErrorMessage: "message:error",

  // ── Phase 37: Circle discussion ───────────────────────────────────────────
  //
  // Namespaced `circle:*` rather than reused from the DM set, matching the
  // backend's own split in `skill-be/src/messages/messaging-events.ts`, so the
  // two surfaces can never be confused for one another in a listener.

  /** Client → server: "I am looking at this circle's discussion." */
  JoinCircle: "circle:join",
  /** Server → client: the circle room was joined after membership was verified. */
  JoinedCircle: "circle:joined",
  /** Client → server: "I am no longer looking at this circle." */
  LeaveCircle: "circle:leave",
  /** Server → client: the circle room was left. */
  LeftCircle: "circle:left",
  /** Client → server: send a Circle discussion message. */
  SendCircleMessage: "circle:message:send",
  /** Server → clients: a Circle discussion message was committed to Firestore. */
  NewCircleMessage: "circle:message:new",
  /** Server → sender: the stored version of the Circle message just sent. */
  AckCircleMessage: "circle:message:ack",
  /** Server → client: a Circle send failed, with a typed code. */
  ErrorCircleMessage: "circle:message:error",
  /** Server → clients: a Circle message was moderated away. */
  CircleMessageDeleted: "circle:message:deleted",
} as const;

export const MESSAGING_ERROR_CODES = {
  Unauthenticated: "UNAUTHENTICATED",
  Forbidden: "FORBIDDEN",
  ConversationNotFound: "CONVERSATION_NOT_FOUND",
  NotConversationMember: "NOT_CONVERSATION_MEMBER",
  MessageInvalid: "MESSAGE_INVALID",
  MessageTooLong: "MESSAGE_TOO_LONG",
  MessageDuplicate: "MESSAGE_DUPLICATE",
  InternalError: "INTERNAL_ERROR",

  // ── Phase 37: Circle discussion ───────────────────────────────────────────
  //
  // `CIRCLE_NOT_FOUND` is one code for "the circle does not exist" and "you are
  // not a member of it", exactly like `CONVERSATION_NOT_FOUND` in DMs: reporting
  // the difference over a socket would turn it into an existence oracle for
  // private circles. It is also the answer for a PUBLIC circle whose name the
  // caller may see, but whose discussion they cannot read.

  CircleNotFound: "CIRCLE_NOT_FOUND",
  CircleMessageInvalid: "CIRCLE_MESSAGE_INVALID",
  CircleMessageTooLong: "CIRCLE_MESSAGE_TOO_LONG",
} as const;

export type MessagingErrorCode =
  (typeof MESSAGING_ERROR_CODES)[keyof typeof MESSAGING_ERROR_CODES];

/**
 * Failures the client itself invents, which the server never sends.
 *
 * They exist so a transport problem is distinguishable from a server's answer.
 * Both are worth falling back from, but they are different things: a
 * `SOCKET_UNAVAILABLE` will not fix itself, while a `SOCKET_TIMEOUT` usually
 * means the message may already be stored and only the answer was lost.
 */
export const MESSAGING_TRANSPORT_CODES = {
  Unavailable: "SOCKET_UNAVAILABLE",
  Timeout: "SOCKET_TIMEOUT",
} as const;

export type MessagingTransportCode =
  (typeof MESSAGING_TRANSPORT_CODES)[keyof typeof MESSAGING_TRANSPORT_CODES];

/** Any failure the send path can produce, from either end. */
export type MessagingFailureCode = MessagingErrorCode | MessagingTransportCode;

export interface NewMessageEvent {
  message: Message;
}

export interface MessageAckEvent {
  clientMessageId: string | null;
  message: Message;
}

export interface MessageErrorEvent {
  clientMessageId: string | null;
  code: MessagingErrorCode;
  message: string;
}

export type MessageSendResult =
  | { ok: true; clientMessageId: string | null; message: Message }
  | {
      ok: false;
      clientMessageId: string | null;
      code: MessagingErrorCode;
      message: string;
    };

/** Must match the backend's id format: `c_<conversationId>_<uid>_<clientMessageId>`. */
export const SERVER_MESSAGE_ID_PREFIX = "c_";

/**
 * How long to wait for a send's ack before treating the socket as unusable for
 * that send.
 *
 * Generous on purpose. The ack is not the only confirmation — the sender is also
 * in the `user:<uid>` room and gets a `message:new` for its own message — so a
 * slow ack is a delay, not a loss, and falling back early would spend a REST
 * round trip on a send that is very likely already stored. The fallback is
 * idempotent either way; this only decides how patient the primary path is.
 */
export const SEND_ACK_TIMEOUT_MS = 8000;

/**
 * How long to wait for the handshake before the first `connect_error` counts as
 * "this socket is not usable" and REST takes over for sends.
 */
export const HANDSHAKE_TIMEOUT_MS = 10000;

/** User-facing copy for each code. Never echoes a server string verbatim. */
const MESSAGING_ERROR_COPY: Record<MessagingErrorCode, string> = {
  UNAUTHENTICATED: "Your session has expired. Please sign in again.",
  FORBIDDEN: "You don't have access to this conversation.",
  CONVERSATION_NOT_FOUND: "This conversation could not be found.",
  NOT_CONVERSATION_MEMBER: "You don't have access to this conversation.",
  MESSAGE_INVALID: "Please write a message before sending.",
  MESSAGE_TOO_LONG: "That message is too long. Please shorten it a little.",
  MESSAGE_DUPLICATE: "That message was already sent.",
  INTERNAL_ERROR: "Something went wrong. Please try again.",
  CIRCLE_NOT_FOUND: "You don't have access to this circle's discussion.",
  CIRCLE_MESSAGE_INVALID: "Please write a message before sending.",
  CIRCLE_MESSAGE_TOO_LONG: "That message is too long. Please shorten it a little.",
};

/** A stable, user-safe sentence for any code, including an unknown one. */
export function describeMessagingError(code: string | null | undefined): string {
  if (!code) return MESSAGING_ERROR_COPY.INTERNAL_ERROR;
  return (
    MESSAGING_ERROR_COPY[code as MessagingErrorCode] ??
    MESSAGING_ERROR_COPY.INTERNAL_ERROR
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Connection status
// ─────────────────────────────────────────────────────────────────────────────

export type ConnectionStatus =
  /** No socket has been created (signed out, or the tab is not yet mounted). */
  | "idle"
  /** Created, not yet connected. */
  | "connecting"
  /** Transport is up; the Firebase handshake has been accepted. */
  | "connected"
  /** A connection existed and was lost; a reconnect is in progress. */
  | "reconnecting"
  /** Permanently failed for this session — sends go over REST. */
  | "unavailable";

/** Whether sends should try the socket first on this status. */
export function canSendOverSocket(status: ConnectionStatus): boolean {
  return status === "connected" || status === "reconnecting";
}

/**
 * Whether the UI should say anything at all.
 *
 * Only a degraded transport is worth interrupting the user for. A reconnect in
 * progress after a brief drop is invisible: messages keep arriving over REST and
 * showing "reconnecting…" every time a laptop sleeps would be noise, not
 * information.
 */
export function shouldSurfaceConnectionWarning(
  status: ConnectionStatus
): boolean {
  return status === "unavailable";
}

export function connectionStatusLabel(status: ConnectionStatus): string {
  switch (status) {
    case "idle":
      return "";
    case "connecting":
      return "Connecting…";
    case "connected":
      return "Live";
    case "reconnecting":
      return "Reconnecting…";
    case "unavailable":
      return "Realtime unavailable — messages will send normally.";
    default:
      return "";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Send-fallback policy
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Whether a failed socket send is worth retrying over REST.
 *
 * Split by *who decided the send failed*, not by how it looks:
 *
 *  • `UNAUTHENTICATED` — the socket's token was rejected. REST will reject the
 *    same token, so retrying only spends a round trip. (A fresh token produces a
 *    fresh socket, and the next send goes over it.)
 *  • `MESSAGE_INVALID` / `MESSAGE_TOO_LONG` — the server already read and
 *    rejected the payload. REST would reject it identically. Retrying a message
 *    the server refused to accept is how a user ends up staring at a permanent
 *    error with no way forward.
 *  • `CONVERSATION_NOT_FOUND` / `NOT_CONVERSATION_MEMBER` / `FORBIDDEN` — a real
 *    answer about who may write here, not a transport problem. REST enforces the
 *    same rule, so a retry cannot succeed.
 *  • Phase 37's circle refusals, `CIRCLE_NOT_FOUND`, `CIRCLE_MESSAGE_INVALID` and
 *    `CIRCLE_MESSAGE_TOO_LONG`, are the identical situation restated for circles:
 *    the server already read and rejected the request, and REST would refuse it
 *    exactly the same way — so proceeding to REST would only repeat a no.
 *
 * Everything else is a transport symptom: a socket that is not up, an ack that
 * never arrived, or `INTERNAL_ERROR` where the socket genuinely cannot tell a
 * transient fault from a committed write. REST is then the only way to find out,
 * and it is safe precisely because the retry reuses the same `clientMessageId`.
 */
export function shouldFallBackToRest(code: string | null | undefined): boolean {
  if (!code) return true;
  switch (code) {
    case MESSAGING_ERROR_CODES.Unauthenticated:
    case MESSAGING_ERROR_CODES.Forbidden:
    case MESSAGING_ERROR_CODES.NotConversationMember:
    case MESSAGING_ERROR_CODES.ConversationNotFound:
    case MESSAGING_ERROR_CODES.MessageInvalid:
    case MESSAGING_ERROR_CODES.MessageTooLong:
    case MESSAGING_ERROR_CODES.CircleNotFound:
    case MESSAGING_ERROR_CODES.CircleMessageInvalid:
    case MESSAGING_ERROR_CODES.CircleMessageTooLong:
      return false;
    default:
      return true;
  }
}

/** A send failure from either the socket transport or the server. */
export class MessagingError extends Error {
  readonly code: MessagingFailureCode;

  constructor(code: MessagingFailureCode, message?: string) {
    super(message ?? describeMessagingError(code));
    this.name = "MessagingError";
    this.code = code;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Identity of a message
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The `clientMessageId` a stored message was created from, when it can be
 * recovered.
 *
 * The sender is in their own `user:<uid>` room, so they receive a `message:new`
 * for their own message — and that broadcast can beat the send's ack. Without
 * this, the optimistic `pending:<clientMessageId>` bubble and the server copy
 * would both sit in the thread until the ack arrived.
 *
 * The server id is `c_<conversationId>_<senderUid>_<sanitisedClientMessageId>`, so
 * the tail is recoverable when this client is the sender. `null` is a real
 * answer, not a failure: a message someone else sent, or one whose id was
 * assigned by the server rather than from a key, simply has no pending bubble to
 * reconcile. The ack path still covers those, and a REST refetch is the backstop.
 */
export function deriveClientMessageId(
  message: Pick<Message, "id" | "conversationId" | "senderId">,
  currentUid: string
): string | null {
  if (!currentUid || message.senderId !== currentUid) return null;

  const prefix = `${SERVER_MESSAGE_ID_PREFIX}${message.conversationId}_${currentUid}_`;
  if (!message.id.startsWith(prefix)) return null;

  const tail = message.id.slice(prefix.length);
  return tail.length > 0 ? tail : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache merge rules
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fold a message into a newest-first page, exactly once.
 *
 * Three inputs can describe the same message: the optimistic bubble, the
 * `message:new` broadcast, and the send's ack. This is the one place they are
 * made to agree, and it must be idempotent — a React Query write can run more
 * than once for one event (StrictMode, a re-render mid-flight), and a transport
 * that "helpfully" showed a second copy of a message would be worse than the poll
 * it replaced.
 *
 * Resolution order, by id:
 *  1. drop any pending bubble for the same `clientMessageId` — the server copy
 *     replaces it, which is what makes the bubble stop being pending;
 *  2. drop any existing entry with the same id — the newest copy wins;
 *  3. insert in chronological position.
 *
 * Ordering is by `createdAt` and then by id, so two messages that share a
 * millisecond (a rapid double-send, or a message and its own ack) still have a
 * stable order that cannot flip between renders.
 */
export function mergeMessageNewestFirst<T extends Message>(
  items: readonly T[],
  message: Message,
  options: { currentUid: string; clientMessageId?: string | null }
): T[] {
  const clientMessageId =
    options.clientMessageId ??
    deriveClientMessageId(message, options.currentUid);

  let base = items;
  if (clientMessageId) {
    base = removeById(base, pendingMessageId(clientMessageId));
  }
  base = removeById(base, message.id);

  return insertNewestFirst(base, message as T);
}

/** Newest first, by `createdAt` then id. */
export function sortNewestFirst<T extends Message>(items: readonly T[]): T[] {
  return items.slice().sort((a, b) => {
    const delta =
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (delta !== 0) return delta;
    return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
  });
}

/**
 * Fold a `message:new` into the viewer's open thread.
 *
 * Generic over the cache entry rather than a hand-written shape, so the
 * `pageParams` React Query's `InfiniteData` carries survive the write. Returning
 * `undefined` when there is nothing to change lets an updater hand back the
 * original object identity, so a thread that did not change does not re-render
 * or replay its entrance animation.
 */
export function applyIncomingMessage<D extends { pages: MessagePage[] }>(
  data: D | undefined,
  message: Message,
  currentUid: string
): D | undefined {
  if (!data || data.pages.length === 0) return data;

  // Already loaded somewhere. A repeat delivery must not produce a second copy,
  // and re-inserting would also make the thread re-animate a message the reader
  // has already seen.
  const alreadyLoaded = data.pages.some((page) =>
    page.items.some((item) => item.id === message.id)
  );
  if (alreadyLoaded) return data;

  return {
    ...data,
    pages: data.pages.map((page, index) =>
      index === 0
        ? {
            ...page,
            items: sortNewestFirst(
              mergeMessageNewestFirst(page.items, message, { currentUid })
            ),
          }
        : page
    ),
  };
}

export interface InboxUpdateContext {
  currentUid: string;
  /** The conversation the viewer currently has open, if any. */
  activeConversationId: string | null;
  /** Whether the viewer is looking at the app right now. */
  isVisible: boolean;
}

/**
 * Fold a `message:new` into the conversation list.
 *
 * This is what replaces the 30-second inbox poll. The recipient is told about a
 * message in a conversation they may not have open, so the list's preview and
 * unread count have to be updated here or the badge stays wrong until something
 * else happens to refetch.
 *
 * Unread is incremented only for an incoming message, and only when the viewer
 * is not already looking at that thread: a message that has just been rendered
 * on screen is read, and counting it would show "1 unread" for a conversation
 * with nothing unread in it.
 */
export function applyIncomingToConversations<
  D extends { pages: ConversationPage[] }
>(
  data: D | undefined,
  message: Message,
  context: InboxUpdateContext
): D | undefined {
  if (!data) return data;

  const isOwn = message.senderId === context.currentUid;
  const isActive =
    context.activeConversationId === message.conversationId && context.isVisible;
  const shouldCountUnread = !isOwn && !isActive;

  let changed = false;

  const pages = data.pages.map((page) => ({
    ...page,
    items: page.items.map((conversation) => {
      if (conversation.id !== message.conversationId) return conversation;

      changed = true;
      return {
        ...conversation,
        lastMessage: {
          text: message.text,
          senderId: message.senderId,
          createdAt: message.createdAt,
        },
        unreadCount: shouldCountUnread
          ? conversation.unreadCount + 1
          : conversation.unreadCount,
      };
    }),
  }));

  return changed ? { ...data, pages } : data;
}

/** Whether a conversation row's preview and unread count are already current. */
export function inboxIsUpToDate(
  data: { pages: ConversationPage[] } | undefined,
  message: Message
): boolean {
  if (!data) return false;
  const conversation = data.pages
    .flatMap((page) => page.items)
    .find((item) => item.id === message.conversationId);
  if (!conversation) return false;
  return conversation.lastMessage?.createdAt === message.createdAt;
}

/**
 * Whether a `message:new` names a conversation the list has not loaded.
 *
 * A conversation created moments ago by the other participant can be older than
 * the first loaded page, so a `message:new` for it has nowhere to write. The
 * detail response is the only source of `otherUser`, so the caller refetches
 * rather than guessing an identity.
 */
export function conversationIsMissing(
  data: { pages: ConversationPage[] } | undefined,
  conversationId: string
): boolean {
  if (!data) return true;
  return !data.pages.some((page) =>
    page.items.some((item) => item.id === conversationId)
  );
}

/** The optimistic bubble for a send, matching `useSendMessage`'s insert. */
export function buildOptimisticMessage(input: {
  pendingId: string;
  conversationId: string;
  currentUid: string;
  recipientId: string;
  text: string;
  clientMessageId: string;
  createdAt: string;
}): ThreadMessage {
  return {
    id: input.pendingId,
    conversationId: input.conversationId,
    senderId: input.currentUid,
    recipientId: input.recipientId,
    text: input.text,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    pending: true,
    clientMessageId: input.clientMessageId,
  };
}

/** True for a bubble that is still waiting on its send. */
export function isPendingThreadMessage(
  message: ThreadMessage
): boolean {
  return message.pending === true;
}

/**
 * How many pending bubbles a thread is still waiting on.
 *
 * Only ever used to decide whether to say anything to the user. A pending bubble
 * is a waiting state, not an error: the send may still be in flight, may have
 * been answered by a `message:new` that reconciliation handled, or may be a
 * genuinely stuck optimistic copy that a later refetch will replace.
 */
export function countPendingMessages(
  messages: readonly ThreadMessage[]
): number {
  let count = 0;
  for (const message of messages) {
    if (isPendingThreadMessage(message)) count += 1;
  }
  return count;
}

/** True when the id is one of ours rather than a server-assigned one. */
export function isOptimisticId(id: string): boolean {
  return id.startsWith(PENDING_MESSAGE_ID_PREFIX);
}

// ─────────────────────────────────────────────────────────────────────────────
// Circle message identity and cache merges (Phase 37)
//
// The same merge rules as the DM set, restated for the distinct Circle types.
// Three inputs can describe the same message — the optimistic bubble, the
// `circle:message:new` broadcast and the send's ack — and these are the one place
// they are made to agree, idempotently. `applyCircleMessageDeleted` uses the
// soft-delete shape the server broadcasts: only the id, the circle and the time,
// never the text that was removed.
// ─────────────────────────────────────────────────────────────────────────────

/** Must match the backend's id format: `cm_<circleId>_<uid>_<clientMessageId>`. */
export const CIRCLE_SERVER_MESSAGE_ID_PREFIX = "cm_";

/** The wire answer to a `circle:message:send`. */
export type CircleMessageSendResult =
  | {
      ok: true;
      clientMessageId: string | null;
      message: CircleMessage;
    }
  | {
      ok: false;
      clientMessageId: string | null;
      code: MessagingErrorCode;
      message: string;
    };

/** Server → client, `circle:message:deleted`. Text is deliberately absent. */
export interface CircleMessageDeletedEvent {
  circleId: string;
  messageId: string;
  deletedAt: string;
}

/**
 * Recover the `clientMessageId` a stored Circle message was created from.
 *
 * The sender is in the circle room, so they receive a `circle:message:new` for
 * their own message — and that broadcast can beat the send's ack. Without this,
 * the optimistic `pending:<clientMessageId>` bubble and the server copy would
 * both sit in the thread until the ack arrived.
 *
 * Server ids are `cm_<circleId>_<senderUid>_<sanitisedClientMessageId>`, so the
 * tail is recoverable when this client is the sender. `null` is a real answer:
 * someone else's message, or one stored without an idempotency key.
 */
export function deriveCircleClientMessageId(
  message: Pick<CircleMessage, "id" | "circleId" | "senderId">,
  currentUid: string
): string | null {
  if (!currentUid || message.senderId !== currentUid) return null;

  const prefix = `${CIRCLE_SERVER_MESSAGE_ID_PREFIX}${message.circleId}_${currentUid}_`;
  if (!message.id.startsWith(prefix)) return null;

  const tail = message.id.slice(prefix.length);
  return tail.length > 0 ? tail : null;
}

/** The optimistic bubble for a Circle send, mirroring `buildOptimisticMessage`. */
export function buildOptimisticCircleMessage(input: {
  pendingId: string;
  circleId: string;
  currentUid: string;
  text: string;
  clientMessageId: string;
  createdAt: string;
}): ThreadCircleMessage {
  return {
    id: input.pendingId,
    circleId: input.circleId,
    senderId: input.currentUid,
    text: input.text,
    createdAt: input.createdAt,
    isDeleted: false,
    deletedAt: null,
    clientMessageId: input.clientMessageId,
    pending: true,
  };
}

/**
 * Fold a Circle message into a newest-first page, exactly once.
 *
 * Resolution order, by id: drop any pending bubble for the same `clientMessageId`
 * (the server copy replaces it), drop any existing entry with the same id, then
 * insert in chronological position. The write is idempotent under StrictMode and
 * under the broadcast/ack race, exactly like `mergeMessageNewestFirst`.
 */
export function mergeCircleMessageNewestFirst<T extends CircleMessage>(
  items: readonly T[],
  message: CircleMessage,
  options: { currentUid: string; clientMessageId?: string | null }
): T[] {
  const clientMessageId =
    options.clientMessageId ??
    deriveCircleClientMessageId(message, options.currentUid);

  let base = items;
  if (clientMessageId) {
    base = removeById(base, pendingMessageId(clientMessageId));
  }
  base = removeById(base, message.id);

  return insertNewestFirst(base, message as T);
}

/** Newest first, by `createdAt` then id. */
export function sortCircleNewestFirst<T extends CircleMessage>(
  items: readonly T[]
): T[] {
  return items.slice().sort((a, b) => {
    const delta =
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (delta !== 0) return delta;
    return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
  });
}

/**
 * Fold a `circle:message:new` into the newest-first Circle message cache for the
 * circle it names. Returns the original object identity when nothing changed, so
 * a thread that did not change does not re-render or replay an animation.
 */
export function applyIncomingCircleMessage<D extends { pages: CircleMessagePage[] }>(
  data: D | undefined,
  message: CircleMessage,
  currentUid: string
): D | undefined {
  if (!data || data.pages.length === 0) return data;

  const alreadyLoaded = data.pages.some((page) =>
    page.items.some((item) => item.id === message.id)
  );
  if (alreadyLoaded) return data;

  return {
    ...data,
    pages: data.pages.map((page, index) =>
      index === 0
        ? {
            ...page,
            items: sortCircleNewestFirst(
              mergeCircleMessageNewestFirst(page.items, message, { currentUid })
            ),
          }
        : page
    ),
  };
}

/**
 * Fold a `circle:message:deleted` into the cache.
 *
 * The message is marked as moderated away in place — text cleared, `deletedAt`
 * stamped — because the soft delete is what keeps the thread's shape while
 * taking the content away. Idempotent by message id, and a no-op when the id is
 * not in the cache (a client is never handed content it was not shown; it is
 * simply told that something is gone). Returns `undefined` when nothing changed,
 * preserving the cached object's identity so no re-render is forced.
 */
export function applyCircleMessageDeleted<D extends { pages: CircleMessagePage[] }>(
  data: D | undefined,
  input: CircleMessageDeletedEvent
): D | undefined {
  if (!data || data.pages.length === 0) return data;

  let changed = false;
  const pages = data.pages.map((page) => ({
    ...page,
    items: page.items.map((item) => {
      if (item.id !== input.messageId) return item;
      // Already removed (a second moderator, or the sender's own broadcast).
      if (item.isDeleted && item.deletedAt !== null) return item;
      changed = true;
      return {
        ...item,
        text: "",
        isDeleted: true,
        deletedAt: input.deletedAt,
      };
    }),
  }));

  return changed ? { ...data, pages } : data;
}

/** True for a bubble that is still waiting on its send. */
export function isPendingCircleMessage(message: ThreadCircleMessage): boolean {
  return message.pending === true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Socket construction
// ─────────────────────────────────────────────────────────────────────────────

export interface MessagingSocketOptions {
  /** Backend origin, e.g. `http://localhost:7000`. */
  url: string;
  /** Firebase ID token for the handshake. */
  token: string;
}

/**
 * Create the messaging socket.
 *
 * A fresh token is passed per creation rather than refreshed in place: Socket.IO
 * replays the `auth` payload the socket was constructed with, so a socket built
 * with a token that later expired would reconnect into a permanent
 * `UNAUTHENTICATED` rejection no matter how many times it retried. The provider
 * therefore treats a token refresh as a reason to build a new socket.
 *
 * Event listeners are registered by the caller rather than here, so the status
 * machine has exactly one implementation and cannot disagree with itself.
 */
export function createMessagingSocket(options: MessagingSocketOptions): Socket {
  // The namespace is part of the URL `io()` is given, not an afterthought.
  //
  // The server mounts every messaging handler on the `/messaging` namespace, so
  // a socket opened on the default `/` namespace completes its handshake and
  // reports "connected" while every event it emits lands in a namespace with no
  // listeners. Nothing errors, nothing arrives, and no ack is ever answered —
  // which looks exactly like a silent server. Naming the namespace here is what
  // makes `connect` mean "my handlers are live" rather than "TCP is up".
  return io(`${options.url}${MESSAGING_NAMESPACE}`, {
    // The default path, stated explicitly so a proxy in front of the backend
    // has one documented value to allow rather than an implicit default.
    path: "/socket.io",
    auth: { token: options.token },
    // Websocket first so a working realtime path never pays for a polling
    // upgrade; the polling fallback is what makes the socket survive a proxy
    // that cannot upgrade.
    transports: ["websocket", "polling"],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    // Fast first retry, then a bounded backoff: a laptop waking from sleep should
    // recover in about a second, while a server that is down for an hour should
    // not be hammered with reconnect attempts.
    reconnectionDelay: 500,
    reconnectionDelayMax: 10_000,
    timeout: HANDSHAKE_TIMEOUT_MS,
    autoConnect: true,
  });
}

/**
 * Emit and wait for the ack, with a timeout.
 *
 * The timeout is the important part: a dropped connection means the ack will
 * never arrive, and a promise that waited for one forever would leave the
 * composer spinning with the user's text stuck in the box. Rejecting turns a lost
 * ack into an ordinary send failure, which the caller already knows how to fall
 * back from — and because the fallback reuses the same `clientMessageId`, a
 * message that was in fact committed is not posted twice.
 */
export function emitWithAck<T>(
  socket: Socket,
  event: string,
  payload: unknown,
  timeoutMs: number = SEND_ACK_TIMEOUT_MS
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new MessagingError(MESSAGING_TRANSPORT_CODES.Timeout));
    }, timeoutMs);

    socket.emit(event, payload, (response: T) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(response);
    });
  });
}
