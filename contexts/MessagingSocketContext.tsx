"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { onIdTokenChanged } from "firebase/auth";
import type { Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import { useDocumentVisibility } from "@/hooks/useDocumentVisibility";
import {
  CONVERSATIONS_QUERY_KEY,
  CONVERSATION_QUERY_KEY,
  MESSAGES_QUERY_KEY,
} from "@/hooks/useConversations";
import { CIRCLE_MESSAGES_QUERY_KEY } from "@/hooks/useCircleMessages";
import {
  CIRCLE_DETAIL_QUERY_KEY,
  CIRCLE_MEMBERS_QUERY_KEY,
} from "@/hooks/useCircles";
import { auth } from "@/lib/firebase";
import { conversationsApi, circlesApi } from "@/lib/api";
import {
  MESSAGING_EVENTS,
  MessagingError,
  applyIncomingMessage,
  applyIncomingToConversations,
  applyIncomingCircleMessage,
  applyCircleMessageDeleted,
  canSendOverSocket,
  connectionStatusLabel,
  conversationIsMissing,
  createMessagingSocket,
  emitWithAck,
  shouldFallBackToRest,
  shouldSurfaceConnectionWarning,
  type CircleMessageDeletedEvent,
  type CircleMessageSendResult,
  type ConnectionStatus,
  type MessageSendResult,
} from "@/lib/messagingSocket";
import type {
  CircleMessage,
  CircleMessagePage,
  ConversationPage,
  Message,
  MessagePage,
} from "@/types";

/**
 * The one messaging socket for the whole app.
 *
 * Everything that must be singular lives here: the connection, the event
 * listeners, and which conversation the viewer currently has open. Components
 * never hold a socket — they read the status from here while the listeners write
 * into the exact cache entries the query hooks already read, which is why the
 * thread component did not have to change at all to gain realtime delivery.
 *
 * The alternative, a socket per mounted thread, would multiply connections per
 * user, re-run the Firebase handshake for each one, and deliver every broadcast
 * once per open thread.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7000";

export interface MessagingSocketContextValue {
  status: ConnectionStatus;
  /** Whether the UI should mention the transport at all. */
  isDegraded: boolean;
  /** A short status string, or `""` when there is nothing worth saying. */
  statusLabel: string;
  /** The conversation the viewer currently has open, for unread accounting. */
  activeConversationId: string | null;
  setActiveConversationId: (conversationId: string | null) => void;
  /** Join the room for an open conversation. No-op while the socket is down. */
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  /**
   * Send over the socket, falling back to REST.
   *
   * The fallback reuses the same `clientMessageId`, so a socket that committed
   * the message and then lost the connection produces one message, not two.
   */
  sendMessage: (input: {
    conversationId: string;
    text: string;
    clientMessageId: string;
  }) => Promise<Message>;
  /** The circle whose discussion is currently open, for the room join. */
  activeCircleId: string | null;
  setActiveCircleId: (circleId: string | null) => void;
  /** Join the discussion room for an open circle. No-op while the socket is down. */
  joinCircle: (circleId: string) => void;
  leaveCircle: (circleId: string) => void;
  /**
   * Send a Circle discussion message over the socket, falling back to REST.
   *
   * The same contract as `sendMessage`: the fallback reuses the same
   * `clientMessageId`, so a committed-but-unacknowledged send collapses onto the
   * one document instead of posting twice.
   */
  sendCircleMessage: (input: {
    circleId: string;
    text: string;
    clientMessageId: string;
  }) => Promise<CircleMessage>;
}

export const MessagingSocketContext =
  createContext<MessagingSocketContextValue | null>(null);

/** A send, as both transports accept it. */
interface SendInput {
  conversationId: string;
  text: string;
  clientMessageId: string;
}

export function MessagingSocketProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { firebaseUser } = useAuth();
  const queryClient = useQueryClient();
  const isVisible = useDocumentVisibility();

  /**
   * The current ID token, paired with the uid it belongs to.
   *
   * `onIdTokenChanged` fires on sign-in and again roughly every hour when
   * Firebase silently re-mints an expired token — which is exactly the signal
   * needed here, because Socket.IO replays the `auth` payload a socket was built
   * with. Tying the socket's lifetime to the token means a reconnect always
   * presents a token that is still valid, instead of failing into a reconnect
   * loop that could never recover on its own.
   *
   * The uid is stored alongside because a token is only ever valid for the user
   * it was minted for. Pairing them lets "signed out" be *derived* by comparing
   * the two, rather than by clearing a second piece of state from inside an
   * effect — which also means a stale token from the previous account can never
   * briefly open a socket for the new one.
   */
  const [authState, setAuthState] = useState<{
    uid: string;
    token: string;
  } | null>(null);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsubscribe = onIdTokenChanged(auth, (user) => {
      if (!user) {
        setAuthState(null);
        return;
      }
      void user
        .getIdToken()
        .then((value) => setAuthState({ uid: user.uid, token: value }))
        .catch(() => setAuthState(null));
    });
    return () => unsubscribe();
  }, [firebaseUser]);

  const token =
    authState && authState.uid === firebaseUser?.uid ? authState.token : null;

  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  // The circle whose discussion is open. Mirrors `activeConversationId`; the two
  // are separate so joining a circle's room never interferes with a conversation
  // room and a conversation listener can never be confused by a circle event.
  const [activeCircleId, setActiveCircleId] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const uid = firebaseUser?.uid ?? "";

  /**
   * The transport status, paired with the token it was observed for.
   *
   * Pairing them is what lets "connecting" be *derived* rather than stored: a
   * token that has no status yet is by definition still connecting, so the effect
   * that owns the connection only ever has to report what actually happened
   * instead of also being responsible for announcing what it is about to do. It
   * also means a new token can never inherit the previous socket's "connected",
   * which would otherwise leave the UI claiming a live transport that is not
   * there yet.
   */
  const [statusState, setStatusState] = useState<{
    token: string;
    status: ConnectionStatus;
  } | null>(null);

  /**
   * Counts established namespace connections.
   *
   * This exists because `statusState` cannot be trusted to tell the room effect
   * when the socket is usable. Socket.IO reports two different "back" events:
   * `socket.io`'s `reconnect` belongs to the Manager (the transport), and it
   * fires *before* the Socket has finished re-establishing the namespace. React
   * then renders with a status of "connected" while `socket.connected` is still
   * false, so the room effect runs, sees a socket it cannot emit on, and returns
   * — and because the status string is already "connected", nothing changes
   * afterwards to make it run again. The thread is left joined to nothing: push
   * still arrives through the server-side `user:<uid>` room, but the conversation
   * room is never restored and no further reconnect attempt would fix it.
   *
   * Bumping this from the Socket's own `connect` event instead makes the signal
   * mean "the namespace is established", which is the fact the room actually
   * depends on. It is a counter rather than a boolean so repeated connect events
   * each produce a fresh effect run.
   */
  const [connectionEpoch, setConnectionEpoch] = useState(0);

  /**
   * The conversation this socket has actually been joined to.
   *
   * Cleared whenever the transport is lost, because a reconnect starts from no
   * rooms server-side. Before the ack comes back it is claimed optimistically, so
   * two connect events in quick succession cannot emit two joins for one room.
   */
  const joinedRoomRef = useRef<string | null>(null);

  // The circle this socket has actually been joined to, and the one the viewers
  // believes is open. Same lifecycle contract as `joinedRoomRef`: cleared when
  // the transport is lost, claimed optimistically until the join ack lands so a
  // repeated connect event cannot emit two joins for one room.
  const joinedCircleRef = useRef<string | null>(null);

  const effectiveStatus: ConnectionStatus = !token
    ? "idle"
    : statusState?.token === token
      ? statusState.status
      : "connecting";

  // Read inside long-lived socket listeners that are registered once per
  // connection. Refs rather than state, so a listener can never close over a
  // stale value: a `message:new` handler that resolved the current user or the
  // open conversation from a stale closure would write to the wrong cache entry
  // or increment the wrong unread count. Written in an effect rather than during
  // render, and every event that reads them arrives long after commit, so the
  // values are always current by the time they matter.
  const uidRef = useRef(uid);
  const activeConversationRef = useRef<string | null>(null);
  const activeCircleRef = useRef<string | null>(null);
  const isVisibleRef = useRef(isVisible);

  useEffect(() => {
    uidRef.current = uid;
    activeConversationRef.current = activeConversationId;
    activeCircleRef.current = activeCircleId;
    isVisibleRef.current = isVisible;
  });

  /**
   * Fold one `message:new` into every cache that cares about it.
   *
   * Three writes in one place, so no two handlers can disagree about what a
   * message means:
   *
   *  - the open thread, if this is the conversation on screen;
   *  - the conversation list, for the preview and the unread count. This is what
   *    replaces the 30-second inbox poll: the socket is in the viewer's own
   *    `user:<uid>` room, so it hears about every conversation they are part of,
   *    not just the one on display;
   *  - the conversation detail, whose `lastMessage` and `updatedAt` are part of
   *    the response the thread header reads.
   */
  const applyMessage = useCallback(
    (message: Message) => {
      const currentUid = uidRef.current;
      if (!currentUid || !message?.id) return;

      // A conversation the viewer is not part of must never reach their cache.
      // The server cannot send one — membership is re-checked inside the send
      // transaction — so this is a blast-radius guard on a malformed event, not
      // a second authorization rule.
      if (message.senderId !== currentUid && message.recipientId !== currentUid) {
        return;
      }

      queryClient.setQueryData<InfiniteData<MessagePage, string | null>>(
        MESSAGES_QUERY_KEY(currentUid, message.conversationId),
        (old) => applyIncomingMessage(old, message, currentUid)
      );

      const conversationsKey = CONVERSATIONS_QUERY_KEY(currentUid);
      const wasMissing = conversationIsMissing(
        queryClient.getQueryData<InfiniteData<ConversationPage, string | null>>(
          conversationsKey
        ),
        message.conversationId
      );

      queryClient.setQueryData<InfiniteData<ConversationPage, string | null>>(
        conversationsKey,
        (old) =>
          applyIncomingToConversations(old, message, {
            currentUid,
            activeConversationId: activeConversationRef.current,
            isVisible: isVisibleRef.current,
          })
      );

      if (wasMissing) {
        // The row does not exist in the loaded pages and cannot be invented:
        // `otherUser` only comes from the server. One refetch, not a poll.
        void queryClient.invalidateQueries({ queryKey: conversationsKey });
      }

      if (message.recipientId === currentUid) {
        // The recipient's own unread bookkeeping lives in the server's member
        // row, which only REST knows how to recompute.
        void queryClient.invalidateQueries({
          queryKey: CONVERSATION_QUERY_KEY(currentUid, message.conversationId),
        });
      }
    },
    [queryClient]
  );

  /**
   * Fold one `circle:message:new` into the circle discussion cache.
   *
   * Circles have no list-level unread to maintain — the unread count lives in the
   * messages page itself — so this is a single write into the exact cache entry
   * `useCircleMessages` already reads. A message for a circle whose page is not
   * loaded (the viewer is elsewhere, or has never opened it) writes nowhere and
   * costs nothing; the count is recomputed from REST on the next open.
   */
  const applyCircleMessage = useCallback(
    (message: CircleMessage) => {
      const currentUid = uidRef.current;
      if (!currentUid || !message?.id || !message?.circleId) return;

      queryClient.setQueryData<InfiniteData<CircleMessagePage, string | null>>(
        CIRCLE_MESSAGES_QUERY_KEY(currentUid, message.circleId),
        (old) => applyIncomingCircleMessage(old, message, currentUid)
      );
    },
    [queryClient]
  );

  /** Fold a `circle:message:deleted` into the open discussion. */
  const applyCircleDeleted = useCallback(
    (event: CircleMessageDeletedEvent) => {
      const currentUid = uidRef.current;
      if (!currentUid || !event?.circleId || !event?.messageId) return;

      queryClient.setQueryData<InfiniteData<CircleMessagePage, string | null>>(
        CIRCLE_MESSAGES_QUERY_KEY(currentUid, event.circleId),
        (old) => applyCircleMessageDeleted(old, event)
      );
    },
    [queryClient]
  );

  /**
   * A membership revocation pulled the socket out of a circle it still believed
   * it was in. The membership ended over REST too, so the circle page's own reads
   * are stale — invalidating them lets the detail answer 404 / non-member and the
   * page flip out of the discussion without a manual refetch.
   */
  const markCircleRevoked = useCallback(
    (circleId: string) => {
      void queryClient.invalidateQueries({
        queryKey: CIRCLE_DETAIL_QUERY_KEY(circleId),
      });
      void queryClient.invalidateQueries({
        queryKey: CIRCLE_MEMBERS_QUERY_KEY(circleId),
      });
    },
    [queryClient]
  );

  /** Send over REST, or as the fallback when the socket cannot be used. */
  const sendViaRest = useCallback(
    async (input: SendInput): Promise<Message> => {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Not authenticated");
      const currentToken = await currentUser.getIdToken();
      return conversationsApi.sendMessage(
        input.conversationId,
        currentToken,
        input.text,
        input.clientMessageId
      );
    },
    []
  );

  const sendMessage = useCallback(
    async (input: SendInput): Promise<Message> => {
      const socket = socketRef.current;

      if (!socket || !socket.connected || !canSendOverSocket(effectiveStatus)) {
        return sendViaRest(input);
      }

      try {
        const result = await emitWithAck<MessageSendResult>(
          socket,
          MESSAGING_EVENTS.SendMessage,
          {
            conversationId: input.conversationId,
            text: input.text,
            clientMessageId: input.clientMessageId,
          }
        );
        if (!result?.ok) {
          throw new MessagingError(result?.code ?? "INTERNAL_ERROR");
        }
        return result.message;
      } catch (error) {
        // A failure the server would also produce over REST is a real answer
        // about this message, not a transport problem, so it is surfaced to the
        // user instead of being retried somewhere it can only fail again.
        if (error instanceof MessagingError && !shouldFallBackToRest(error.code)) {
          throw error;
        }
        return sendViaRest(input);
      }
    },
    [effectiveStatus, sendViaRest]
  );

  /** Send a Circle message over REST, or as the socket's fallback. */
  const sendCircleMessageViaRest = useCallback(
    async (input: {
      circleId: string;
      text: string;
      clientMessageId: string;
    }): Promise<CircleMessage> => {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Not authenticated");
      const currentToken = await currentUser.getIdToken();
      return circlesApi.sendCircleMessage(
        input.circleId,
        currentToken,
        input.text,
        input.clientMessageId
      );
    },
    []
  );

  const sendCircleMessage = useCallback(
    async (input: {
      circleId: string;
      text: string;
      clientMessageId: string;
    }): Promise<CircleMessage> => {
      const socket = socketRef.current;

      if (!socket || !socket.connected || !canSendOverSocket(effectiveStatus)) {
        return sendCircleMessageViaRest(input);
      }

      try {
        const result = await emitWithAck<CircleMessageSendResult>(
          socket,
          MESSAGING_EVENTS.SendCircleMessage,
          {
            circleId: input.circleId,
            text: input.text,
            clientMessageId: input.clientMessageId,
          }
        );
        if (!result?.ok) {
          throw new MessagingError(result?.code ?? "INTERNAL_ERROR");
        }
        return result.message;
      } catch (error) {
        if (error instanceof MessagingError && !shouldFallBackToRest(error.code)) {
          throw error;
        }
        return sendCircleMessageViaRest(input);
      }
    },
    [effectiveStatus, sendCircleMessageViaRest]
  );

  // ── the connection ─────────────────────────────────────────────────────────
  //
  // Rebuilt on every token change, so a reconnect always presents a live token.
  useEffect(() => {
    if (!token) return;

    const socket = createMessagingSocket({ url: API_BASE_URL, token });
    socketRef.current = socket;
    // A new socket knows about no rooms, so nothing carried over from the one it
    // replaces — including the joins this provider believes it has.
    joinedRoomRef.current = null;
    joinedCircleRef.current = null;

    // Every status write is tagged with this effect's token, so a report from a
    // socket that has already been torn down cannot describe the new one.
    const report = (status: ConnectionStatus) =>
      setStatusState({ token, status });

    const markReconnecting = () => {
      // The rooms went with the transport, so the belief that this socket is in a
      // conversation has to go with it.
      joinedRoomRef.current = null;
      joinedCircleRef.current = null;
      setStatusState((current) =>
        // A status already meaning "unavailable" is deliberately not upgraded
        // back to "reconnecting": a socket the server keeps rejecting should keep
        // reporting itself as unusable rather than flickering between states.
        current?.token === token && current.status === "unavailable"
          ? current
          : { token, status: "reconnecting" }
      );
    };

    // The Socket's own connect is the only signal strong enough to mean "the
    // namespace is live": the Manager's `reconnect` fires first and describes
    // only the transport.
    socket.on("connect", () => {
      report("connected");
      setConnectionEpoch((epoch) => epoch + 1);
    });
    socket.on("disconnect", markReconnecting);
    socket.io.on("reconnect_attempt", markReconnecting);
    socket.on("connect_error", () =>
      setStatusState((current) =>
        current?.token === token && current.status === "connected"
          ? { token, status: "reconnecting" }
          : { token, status: "unavailable" }
      )
    );

    socket.on(
      MESSAGING_EVENTS.NewMessage,
      (payload: { message?: Message } | null) => {
        if (!payload?.message) return;
        applyMessage(payload.message);
      }
    );

    // The sender's own copy. The send's ack callback already resolves that path,
    // so this listener is the safety net for a send that fell back to REST or an
    // ack that was lost — the thread still gets the real message, and the
    // optimistic bubble still gets replaced.
    socket.on(
      MESSAGING_EVENTS.AckMessage,
      (payload: { message?: Message } | null) => {
        if (!payload?.message) return;
        applyMessage(payload.message);
      }
    );

    // ── Phase 37: Circle discussion ─────────────────────────────────────────
    socket.on(
      MESSAGING_EVENTS.NewCircleMessage,
      (payload: { message?: CircleMessage } | null) => {
        if (!payload?.message) return;
        applyCircleMessage(payload.message);
      }
    );

    // The sender's own copy. The ack callback already resolves that path, so this
    // listener is the same safety net as `AckMessage`: a send that fell back to
    // REST or an ack that was lost still folds the real message in.
    socket.on(
      MESSAGING_EVENTS.AckCircleMessage,
      (payload: { message?: CircleMessage } | null) => {
        if (!payload?.message) return;
        applyCircleMessage(payload.message);
      }
    );

    socket.on(
      MESSAGING_EVENTS.CircleMessageDeleted,
      (payload: CircleMessageDeletedEvent | null) => {
        if (!payload) return;
        applyCircleDeleted(payload);
      }
    );

    // Only a membership revocation is worth acting on. A normal leave produces a
    // `circle:left` with no reason, and the room is already gone from this side;
    // a revocation means the server pulled the socket out of a room the client
    // still believed it was in, so the provider stops announcing that circle as
    // open and the thread can draw its membership-ended state.
    socket.on(
      MESSAGING_EVENTS.LeftCircle,
      (payload: { circleId?: string; reason?: string } | null) => {
        if (!payload?.circleId) return;
        if (
          payload.reason === "membership_revoked" &&
          activeCircleRef.current === payload.circleId
        ) {
          setActiveCircleId(null);
          markCircleRevoked(payload.circleId);
        }
      }
    );

    return () => {
      socket.removeAllListeners();
      socket.io.removeAllListeners();
      socket.disconnect();
      joinedRoomRef.current = null;
      joinedCircleRef.current = null;
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [token, applyMessage, applyCircleMessage, applyCircleDeleted, markCircleRevoked]);

  /**
   * Room membership follows the open thread.
   *
   * Keyed on `connectionEpoch` rather than on the status string, because the
   * status can read "connected" while the socket is not yet usable — see the note
   * on `connectionEpoch`. A fresh socket knows about no rooms, so this is also
   * what restores the room after a reconnect.
   */
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !socket.connected || !activeConversationId) return;

    // Already joined on THIS connection. Claimed by the ack path below, so a
    // repeated connect event cannot emit a second join for one room.
    if (joinedRoomRef.current === activeConversationId) return;

    const conversationId = activeConversationId;
    joinedRoomRef.current = conversationId;

    // Acked, not fire-and-forget: the room counts as restored only once the
    // server — which re-checks membership for every join, on this or any other
    // socket — says it is. A refused join clears the claim so the next connect
    // tries again, and leaves the status alone, because a refusal here says
    // nothing about the transport.
    void emitWithAck<{ ok?: boolean }>(
      socket,
      MESSAGING_EVENTS.JoinConversation,
      { conversationId },
    )
      .then((answer) => {
        if (answer?.ok === false && joinedRoomRef.current === conversationId) {
          joinedRoomRef.current = null;
        }
      })
      .catch(() => {
        if (joinedRoomRef.current === conversationId) {
          joinedRoomRef.current = null;
        }
      });

    return () => {
      // Only worth saying if the socket is still up; a leave emitted at the
      // moment of a disconnect is a message nobody is there to receive.
      if (socket.connected) {
        socket.emit(MESSAGING_EVENTS.LeaveConversation, { conversationId });
      }
      if (joinedRoomRef.current === conversationId) {
        joinedRoomRef.current = null;
      }
    };
  }, [activeConversationId, connectionEpoch]);

  /**
   * Circle room membership follows the open discussion.
   *
   * The same machinery as the conversation room above, for the circle the viewer
   * is looking at. Keyed on `connectionEpoch` so a reconnect re-joins the room
   * after the transport comes back, and the join is acked so membership is
   * re-verified by the server — which is also what pulls a removed member's socket
   * out of the room once the reconnect replaces its rooms.
   */
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !socket.connected || !activeCircleId) return;

    // Already joined on THIS connection. Claimed by the ack path below, so a
    // repeated connect event cannot emit a second join for one room.
    if (joinedCircleRef.current === activeCircleId) return;

    const circleId = activeCircleId;
    joinedCircleRef.current = circleId;

    void emitWithAck<{ ok?: boolean }>(
      socket,
      MESSAGING_EVENTS.JoinCircle,
      { circleId },
    )
      .then((answer) => {
        if (answer?.ok === false && joinedCircleRef.current === circleId) {
          joinedCircleRef.current = null;
        }
      })
      .catch(() => {
        if (joinedCircleRef.current === circleId) {
          joinedCircleRef.current = null;
        }
      });

    return () => {
      if (socket.connected) {
        socket.emit(MESSAGING_EVENTS.LeaveCircle, { circleId });
      }
      if (joinedCircleRef.current === circleId) {
        joinedCircleRef.current = null;
      }
    };
  }, [activeCircleId, connectionEpoch]);

  /**
   * Reconcile after a gap.
   *
   * A socket that was disconnected may have missed messages, and a backgrounded
   * tab's socket can be reaped by the browser without the library noticing. One
   * refetch when the tab comes back is the whole of the recovery story — a
   * reconciliation, not a poll.
   */
  const wasVisibleRef = useRef(isVisible);
  useEffect(() => {
    const wasVisible = wasVisibleRef.current;
    wasVisibleRef.current = isVisible;
    if (!wasVisible || !isVisible || !uid) return;
    void queryClient.invalidateQueries({
      queryKey: CONVERSATIONS_QUERY_KEY(uid),
    });
  }, [isVisible, uid, queryClient]);

  const joinConversation = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    setActiveConversationId((current) =>
      current === conversationId ? null : current
    );
  }, []);

  const joinCircle = useCallback((circleId: string) => {
    setActiveCircleId(circleId);
  }, []);

  const leaveCircle = useCallback((circleId: string) => {
    setActiveCircleId((current) => (current === circleId ? null : current));
  }, []);

  const value = useMemo<MessagingSocketContextValue>(
    () => ({
      status: effectiveStatus,
      isDegraded: shouldSurfaceConnectionWarning(effectiveStatus),
      statusLabel: connectionStatusLabel(effectiveStatus),
      activeConversationId,
      setActiveConversationId,
      joinConversation,
      leaveConversation,
      sendMessage,
      activeCircleId,
      setActiveCircleId,
      joinCircle,
      leaveCircle,
      sendCircleMessage,
    }),
    [
      effectiveStatus,
      activeConversationId,
      joinConversation,
      leaveConversation,
      sendMessage,
      activeCircleId,
      joinCircle,
      leaveCircle,
      sendCircleMessage,
    ]
  );

  return (
    <MessagingSocketContext.Provider value={value}>
      {children}
    </MessagingSocketContext.Provider>
  );
}

/**
 * Access the messaging socket.
 *
 * Returns `null` outside the provider instead of throwing. `useSendMessage` is
 * mounted on routes that are not inside the authenticated shell, and a hook that
 * threw would take a public page down with it; returning `null` simply means "no
 * socket here", which the send path already handles by using REST.
 */
export function useMessagingSocket(): MessagingSocketContextValue | null {
  return useContext(MessagingSocketContext);
}
