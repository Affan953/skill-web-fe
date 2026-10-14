"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { aiApi } from "@/lib/api";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { useAiContext } from "@/contexts/AiContext";
import type { AiChatTurn, AiChatSession } from "@/types";

export type AiSendStatus = "idle" | "sending" | "error";

/**
 * State for the floating AI assistant.
 *
 * Conversations are owned by the backend (`aiSessions/{uid}/chats/{id}`), so
 * the client sends only the new turn plus the current page context, then
 * adopts the server's returned history. `sessions` is the ChatGPT-style list;
 * `activeId` points at the open conversation (`null` = brand new draft).
 */
export function useAiChat() {
  const { getToken, isAuthenticated } = useFirebaseToken();
  const { context } = useAiContext();

  const [sessions, setSessions] = useState<AiChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string>("");
  const [messages, setMessages] = useState<AiChatTurn[]>([]);
  const [status, setStatus] = useState<AiSendStatus>("idle");
  const [error, setError] = useState<unknown>(null);
  const [hydrated, setHydrated] = useState(false);
  /** True while an existing conversation's transcript is being fetched. */
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const refreshList = useCallback(
    async (token: string) => {
      try {
        const result = await aiApi.getSessions(token);
        setSessions(result.items);
      } catch {
        // Non-fatal; the conversation itself still works.
      }
    },
    []
  );

  // Hydrate the conversation list once authenticated.
  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated) return;

    void (async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const result = await aiApi.getSessions(token);
        if (!cancelled) setSessions(result.items);
      } catch {
        // Backend unreachable; start with an empty list.
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, getToken]);

  const selectSession = useCallback(
    async (sessionId: string) => {
      abortRef.current?.abort();
      const token = await getToken();
      if (!token) return;
      setStatus("idle");
      setError(null);
      setActiveId(sessionId);
      setMessages([]);
      setLoading(true);
      try {
        const session = await aiApi.getSession(token, sessionId);
        setActiveId(session.id);
        setActiveTitle(session.title);
        setMessages(session.messages);
      } catch {
        setError(new Error("SESSION_LOAD_FAILED"));
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  /** Leave the current conversation and start fresh (nothing is deleted). */
  const startNew = useCallback(() => {
    abortRef.current?.abort();
    setActiveId(null);
    setActiveTitle("");
    setMessages([]);
    setStatus("idle");
    setError(null);
    setLoading(false);
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || status === "sending") return;

      const token = await getToken();
      if (!token) return;

      setStatus("sending");
      setError(null);
      setLoading(false);

      // Optimistically show the user's turn plus an empty assistant bubble that
      // the streamed deltas fill in.
      const now = new Date().toISOString();
      const userTurn: AiChatTurn = {
        role: "user",
        content: trimmed,
        createdAt: now,
      };
      const assistantTurn: AiChatTurn = {
        role: "assistant",
        content: "",
        createdAt: now,
      };
      setMessages((previous) => [...previous, userTurn, assistantTurn]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const result = await aiApi.chatStream(token, trimmed, {
          context,
          sessionId: activeId ?? undefined,
          signal: controller.signal,
          onDelta: (delta) => {
            setMessages((previous) => {
              const next = previous.slice();
              const last = next[next.length - 1];
              if (last && last.role === "assistant") {
                next[next.length - 1] = {
                  ...last,
                  content: last.content + delta,
                };
              }
              return next;
            });
          },
        });
        setMessages(result.messages);
        setActiveId(result.sessionId);
        setActiveTitle(result.title);
        setStatus("idle");
        await refreshList(token);
      } catch (caught) {
        if (controller.signal.aborted) {
          setStatus("idle");
        } else {
          setError(caught);
          setStatus("error");
        }
        // Never leave a blank assistant bubble behind (failure or stop).
        setMessages((previous) => {
          const last = previous[previous.length - 1];
          if (last && last.role === "assistant" && last.content === "") {
            return previous.slice(0, -1);
          }
          return previous;
        });
      } finally {
        abortRef.current = null;
      }
    },
    [getToken, context, status, activeId, refreshList]
  );

  /** Aborts an in-flight streamed reply; partial text stays on screen. */
  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      const token = await getToken();
      if (!token) return;
      setSessions((previous) => previous.filter((s) => s.id !== sessionId));
      if (activeId === sessionId) {
        setActiveId(null);
        setActiveTitle("");
        setMessages([]);
        setStatus("idle");
        setError(null);
        setLoading(false);
      }
      await aiApi.deleteSession(token, sessionId).catch(() => undefined);
    },
    [getToken, activeId]
  );

  const deleteAll = useCallback(async () => {
    abortRef.current?.abort();
    const token = await getToken();
    setMessages([]);
    setActiveId(null);
    setActiveTitle("");
    setStatus("idle");
    setError(null);
    setSessions([]);
    setLoading(false);
    if (!token) return;
    await aiApi.deleteAllSessions(token).catch(() => undefined);
  }, [getToken]);

  return {
    sessions,
    activeId,
    activeTitle,
    messages,
    status,
    error,
    hydrated,
    loading,
    /** True once the conversation list finished loading (and a user exists). */
    canSend: hydrated && isAuthenticated,
    send,
    stop,
    selectSession,
    startNew,
    deleteSession,
    deleteAll,
  };
}