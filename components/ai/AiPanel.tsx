"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  Info,
  Maximize2,
  MessagesSquare,
  Minimize2,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { getUserFacingError } from "@/lib/api";
import { timeAgo } from "@/lib/timeAgo";
import type { AiChatTurn, AiChatSession } from "@/types";
import type { AiSendStatus } from "@/hooks/useAiChat";
import { MarkdownText } from "./MarkdownText";

const MAX_MESSAGE_LENGTH = 2000;
const SHOW_COUNTER_AFTER = 1800;

const SUGGESTIONS = [
  "Summarize my progress this week",
  "Idea for a new focus habit",
  "Help me set a 30-day goal",
];

interface AiPanelProps {
  messages: AiChatTurn[];
  sessions: AiChatSession[];
  activeId: string | null;
  activeTitle: string;
  status: AiSendStatus;
  hydrated: boolean;
  loading: boolean;
  context: string;
  error: unknown;
  canSend: boolean;
  fullscreen: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  onDeleteAll: () => void;
  onClose: () => void;
  onToggleFullscreen: () => void;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ActiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
    </span>
  );
}

function AssistantAvatar() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-white">
      <Bot className="h-4 w-4" aria-hidden="true" />
    </span>
  );
}

function ThreadLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-slate-50/70 px-6 text-center">
      <span
        className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#2563EB]"
        aria-hidden="true"
      />
      <p className="text-xs text-slate-400">Loading conversation…</p>
    </div>
  );
}

function TypingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex items-end gap-2"
    >
      <AssistantAvatar />
      <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <span className="flex items-center gap-1" aria-label="Assistant is typing">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </span>
      </div>
    </motion.div>
  );
}

/**
 * ChatGPT-style conversation history for one user, reused as the desktop
 * sidebar and as the mobile full-panel list.
 */
function ChatList({
  sessions = [],
  activeId = null,
  onSelect,
  onNew,
  onDelete,
  onDeleteAll,
  onBack,
}: {
  sessions?: AiChatSession[];
  activeId?: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
  onBack?: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          {onBack ? (
            <motion.button
              type="button"
              onClick={onBack}
              whileTap={{ scale: 0.9 }}
              aria-label="Back to chat"
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </motion.button>
          ) : null}
          <span className="truncate text-xs font-semibold uppercase tracking-wider text-slate-500">
            Chats
          </span>
        </div>
        <motion.button
          type="button"
          onClick={onNew}
          whileTap={{ scale: 0.92 }}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-[#2563EB]/40 hover:bg-blue-50 hover:text-[#2563EB]"
        >
          <Plus className="h-3 w-3" />
          New
        </motion.button>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {sessions.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-slate-400">
            No conversations yet.
          </p>
        ) : (
          sessions.map((session) => {
            const active = session.id === activeId;
            const relative = timeAgo(session.updatedAt);
            return (
              <div
                key={session.id}
                className={cn(
                  "group relative flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-2 transition-colors",
                  active
                    ? "bg-blue-50"
                    : "hover:bg-slate-100"
                )}
                onClick={() => onSelect(session.id)}
              >
                <MessagesSquare
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    active ? "text-[#2563EB]" : "text-slate-400"
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-[13px] leading-tight",
                      active ? "font-medium text-slate-800" : "text-slate-600"
                    )}
                  >
                    {session.title}
                  </p>
                  {relative ? (
                    <p className="text-[10px] text-slate-400">{relative}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label="Delete conversation"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (window.confirm("Delete this conversation?")) {
                      onDelete(session.id);
                    }
                  }}
                  className="rounded p-1 text-slate-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 focus:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {sessions.length > 0 ? (
        <div className="border-t border-slate-100 p-2">
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Clear all conversations?")) onDeleteAll();
            }}
            className="w-full rounded-lg px-2.5 py-1.5 text-left text-[11px] text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            Clear all
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The floating chat panel. On small screens it is a bottom sheet with the
 * history reachable behind a full-panel list; on `md+` history is a sidebar
 * column and the panel floats above the orb. Fullscreen widens it into a large
 * overlay. Always `z-40`, so it stays below app modals (z-50).
 */
export function AiPanel({
  messages,
  sessions,
  activeId,
  activeTitle,
  status,
  hydrated,
  loading,
  context,
  error,
  canSend,
  fullscreen,
  onSend,
  onStop,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onDeleteAll,
  onClose,
  onToggleFullscreen,
}: AiPanelProps) {
  const [draft, setDraft] = useState("");
  const [view, setView] = useState<"chat" | "history">("chat");
  // Hiding the context chip is remembered per context string, not as a boolean.
  const [hiddenContext, setHiddenContext] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep the thread pinned to the newest message while it grows.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  }, [messages, status]);

  const busy = status === "sending";
  const enabled =
    !busy && !!draft.trim() && !(draft.length > MAX_MESSAGE_LENGTH) && canSend;

  const submit = () => {
    const value = draft.trim();
    if (!value || busy) return;
    onSend(value);
    setDraft("");
    const textarea = textareaRef.current;
    if (textarea) textarea.style.height = "auto";
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
    }
  };

  const tooLong = draft.length > MAX_MESSAGE_LENGTH;
  const errorText = error ? getUserFacingError(error) : null;

  const rootClasses = cn(
    "flex flex-col overflow-hidden bg-white",
    fullscreen
      ? "fixed inset-0 z-40"
      : "fixed inset-x-0 bottom-0 z-40 h-[85dvh] rounded-t-2xl border border-b-0 border-slate-200 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] md:inset-x-auto md:bottom-24 md:right-4 md:h-[min(560px,80vh)] md:w-[640px] md:rounded-2xl md:border-b md:shadow-2xl"
  );

  return (
    <motion.section
      aria-label="SkillUp assistant"
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      className={rootClasses}
    >
        <header className="flex items-center justify-between gap-2 border-b border-slate-100 bg-white px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2563EB] text-white">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {activeId && activeTitle ? activeTitle : "SkillUp Assistant"}
              </p>
              <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <ActiveDot /> Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <HeaderButton
              label="Show chat history"
              onClick={() => setView("history")}
              className="md:hidden"
            >
              <MessagesSquare className="h-4 w-4" />
            </HeaderButton>
            <HeaderButton label="Start a new conversation" onClick={onNewChat}>
              <Plus className="h-4 w-4" />
            </HeaderButton>
            <HeaderButton label="Toggle fullscreen" onClick={onToggleFullscreen}>
              {fullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </HeaderButton>
            <HeaderButton label="Close assistant" onClick={onClose}>
              <X className="h-4 w-4" />
            </HeaderButton>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          {/* Desktop history sidebar */}
          <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200/70 bg-slate-50/50 md:flex">
            <ChatList
              sessions={sessions}
              activeId={activeId}
              onSelect={(id) => void onSelectSession(id)}
              onNew={onNewChat}
              onDelete={onDeleteSession}
              onDeleteAll={onDeleteAll}
            />
          </aside>

          {/* Chat column */}
          <div className="flex min-h-0 flex-1 flex-col">
            {loading ? (
              <ThreadLoading />
            ) : messages.length === 0 && hydrated ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto px-6 py-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563EB] text-white shadow-lg shadow-blue-900/15">
                  <Sparkles className="h-7 w-7" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    SkillUp Assistant
                  </p>
                  <p className="mx-auto mt-1 max-w-[280px] text-xs leading-relaxed text-slate-500">
                    Ask me anything about your habits, goals, circles, or how
                    you&rsquo;re growing. I can see the page you&rsquo;re on.
                  </p>
                </div>
                <div className="flex w-full max-w-[300px] flex-col gap-2">
                  {SUGGESTIONS.map((suggestion, index) => (
                    <motion.button
                      key={suggestion}
                      type="button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + index * 0.08 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setDraft(suggestion)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-600 shadow-sm transition-colors hover:border-[#2563EB]/40 hover:bg-blue-50"
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <div
                ref={scrollerRef}
                className="min-h-0 flex-1 space-y-3.5 overflow-y-auto bg-slate-50/70 px-4 py-4"
              >
                {messages.map((message, index) => {
                  const isUser = message.role === "user";
                  const isLast = index === messages.length - 1;
                  const isStreaming = !isUser && isLast && busy;

                  if (isStreaming && message.content === "") {
                    return <TypingBubble key={`${message.createdAt}-${index}`} />;
                  }

                  return (
                    <motion.div
                      key={`${message.createdAt}-${index}`}
                      initial={{ opacity: 0, y: 10, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className={cn(
                        "flex items-end gap-2",
                        isUser ? "justify-end" : "justify-start"
                      )}
                    >
                      {!isUser ? <AssistantAvatar /> : null}
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm",
                          isUser
                            ? "rounded-br-md bg-[#2563EB] text-white shadow-blue-900/15"
                            : "rounded-bl-sm border border-slate-200 bg-white text-slate-700"
                        )}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        ) : (
                          <MarkdownText
                            content={message.content}
                            streaming={isStreaming}
                          />
                        )}
                        {formatTime(message.createdAt) ? (
                          <p
                            className={cn(
                              "mt-1 text-right text-[10px]",
                              isUser ? "text-blue-100" : "text-slate-400"
                            )}
                          >
                            {formatTime(message.createdAt)}
                          </p>
                        ) : null}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {context && context !== hiddenContext && !fullscreen ? (
              <div className="flex items-start gap-1.5 border-t border-slate-100 bg-slate-50 px-4 py-2">
                <Info
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2563EB]"
                  aria-hidden="true"
                />
                <p className="flex-1 text-[11px] leading-snug text-slate-500">
                  {context}
                </p>
                <button
                  type="button"
                  onClick={() => setHiddenContext(context)}
                  aria-label="Hide page context"
                  className="rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : null}

            <form
              className="border-t border-slate-100 bg-white p-3"
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={draft}
                    onChange={(event) => handleDraftChange(event.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={!canSend || busy}
                    placeholder="Ask SkillUp anything…"
                    aria-label="Message SkillUp assistant"
                    className={cn(
                      "max-h-32 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 transition-all placeholder:text-slate-400",
                      "focus:border-[#2563EB]/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10",
                      "disabled:opacity-60"
                    )}
                  />
                  {draft.length > SHOW_COUNTER_AFTER ? (
                    <p
                      className={cn(
                        "mt-1 text-right text-[10px]",
                        tooLong ? "font-medium text-red-500" : "text-slate-400"
                      )}
                    >
                      {draft.length}/{MAX_MESSAGE_LENGTH}
                    </p>
                  ) : null}
                </div>
                {busy ? (
                  <motion.button
                    type="button"
                    onClick={onStop}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Stop generating"
                    title="Stop generating"
                    className="rounded-xl bg-slate-700 p-2.5 text-white transition-colors hover:bg-slate-800"
                  >
                    <span className="block h-3.5 w-3.5 rounded-[3px] bg-white" />
                  </motion.button>
                ) : (
                  <motion.button
                    type="submit"
                    disabled={!enabled}
                    whileHover={enabled ? { scale: 1.06 } : undefined}
                    whileTap={enabled ? { scale: 0.9 } : undefined}
                    aria-label="Send message"
                    className={cn(
                      "rounded-xl bg-[#2563EB] p-2.5 text-white transition-colors",
                      "hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-35"
                    )}
                  >
                    <Send className="h-4 w-4" />
                  </motion.button>
                )}
              </div>
              {errorText ? (
                <p role="alert" className="mt-1.5 text-[11px] text-red-500">
                  {errorText}
                </p>
              ) : null}
            </form>
          </div>
        </div>

        {/* Mobile history overlay */}
        <AnimatePresence>
          {view === "history" ? (
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="absolute inset-0 z-10 flex flex-col bg-white md:hidden"
            >
              <ChatList
                sessions={sessions}
                activeId={activeId}
                onSelect={(id) => {
                  void onSelectSession(id);
                  setView("chat");
                }}
                onNew={() => {
                  onNewChat();
                  setView("chat");
                }}
                onDelete={onDeleteSession}
                onDeleteAll={onDeleteAll}
                onBack={() => setView("chat")}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.section>
  );
}

function HeaderButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      whileTap={{ scale: 0.88 }}
      className={cn(
        "rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800",
        className
      )}
    >
      {children}
    </motion.button>
  );
}