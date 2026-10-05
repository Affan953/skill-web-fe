"use client";

import { useCallback, useRef, useState } from "react";
import { getUserFacingError } from "@/lib/api";
import { useSendMessage } from "@/hooks/useConversations";
import { usePrefersCoarsePointer } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";

/** Matches the backend's own limit, so the UI never disagrees about validity. */
const MAX_LENGTH = 2000;

/** Grows with the text up to here, then scrolls internally. */
const MAX_COMPOSER_HEIGHT = 160;
const MIN_COMPOSER_HEIGHT = 44;

interface PendingKey {
  clientMessageId: string;
  text: string;
}

function newClientMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Message composer.
 *
 * Two behaviours carry the weight here.
 *
 * **Nothing is lost.** The input is only cleared once the server has confirmed
 * the send, so a timeout or an offline moment leaves the text exactly where it
 * was, with a retry next to it.
 *
 * **A retry cannot double-post.** The `clientMessageId` is tied to the draft,
 * not to the click: retrying the *same* text reuses the key so the backend
 * collapses it onto the message that already exists, while *editing* the text
 * mints a new key so the edit is treated as a new message rather than being
 * silently swallowed by the idempotency check.
 */
export function MessageComposer({
  conversationId,
  disabled,
}: {
  conversationId: string;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const sendMessage = useSendMessage(conversationId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingKeyRef = useRef<PendingKey | null>(null);
  const isCoarsePointer = usePrefersCoarsePointer();

  const trimmed = text.trim();
  const isPending = sendMessage.isPending;
  const canSend = trimmed.length > 0 && !isPending && !disabled;
  const showCounter = text.length > MAX_LENGTH * 0.8;

  /** Grow with the content, then scroll inside a capped box. */
  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(
      Math.max(el.scrollHeight, MIN_COMPOSER_HEIGHT),
      MAX_COMPOSER_HEIGHT
    );
    el.style.height = `${next}px`;
  }, []);

  const handleChange = (value: string) => {
    setText(value);
    if (value.trim().length === 0) {
      // An empty draft is a new draft; nothing in flight to correlate with.
      pendingKeyRef.current = null;
      setError(null);
    }
    // Measure after the value is committed so scrollHeight is current.
    requestAnimationFrame(resize);
  };

  async function handleSend() {
    if (!canSend) return;
    setError(null);

    // Reuse the key only while the text it was minted for is unchanged.
    const existing = pendingKeyRef.current;
    const key =
      existing && existing.text === trimmed
        ? existing
        : { clientMessageId: newClientMessageId(), text: trimmed };

    pendingKeyRef.current = key;

    try {
      await sendMessage.mutateAsync({
        text: trimmed,
        clientMessageId: key.clientMessageId,
      });
      // Confirmed. The draft and its key are both done.
      pendingKeyRef.current = null;
      setText("");
      requestAnimationFrame(() => {
        resize();
        textareaRef.current?.focus();
      });
    } catch (err) {
      // The text and the key both stay, so a retry is the same send.
      setError(getUserFacingError(err));
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter") return;

    // Never hijack Enter mid-composition: an IME candidate window is open and
    // Enter is choosing a character, not sending a message.
    if (event.nativeEvent.isComposing) return;

    // A touch keyboard's Enter is the newline key. Leave it to the keyboard.
    if (isCoarsePointer) return;

    if (event.shiftKey) return;

    event.preventDefault();
    void handleSend();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void handleSend();
      }}
      className="shrink-0 border-t border-slate-200/80 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:px-4"
    >
      {error && (
        <div
          role="alert"
          className="mb-2 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2"
        >
          <svg
            className="h-4 w-4 shrink-0 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p className="min-w-0 flex-1 text-xs font-medium text-red-700">
            {error}
          </p>
          <button
            type="button"
            onClick={() => void handleSend()}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Try again
          </button>
        </div>
      )}

      <div
        className={cn(
          "flex items-end gap-2 rounded-2xl border bg-white p-1.5 transition-[border-color,box-shadow]",
          error
            ? "border-red-300"
            : "border-slate-200 focus-within:border-[#2563EB] focus-within:ring-4 focus-within:ring-[#2563EB]/10"
        )}
      >
        <label htmlFor="message-composer" className="sr-only">
          Write a message
        </label>
        <textarea
          id="message-composer"
          ref={textareaRef}
          value={text}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          maxLength={MAX_LENGTH}
          placeholder="Write a message..."
          className={cn(
            "max-h-40 min-h-[2.75rem] flex-1 resize-none overflow-y-auto bg-transparent px-2.5 py-2 text-[15px] leading-6 text-slate-900",
            "placeholder:text-slate-400 focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
        />

        <div className="flex shrink-0 flex-col items-end gap-0.5 pb-0.5">
          <button
            type="submit"
            disabled={!canSend}
            aria-label={
              isPending ? "Sending message" : "Send message"
            }
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-xl transition-[background-color,transform,color]",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2",
              canSend
                ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-95"
                : "cursor-not-allowed bg-slate-100 text-slate-400"
            )}
          >
            {isPending ? (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden="true"
              />
            ) : (
              <svg
                className="h-[18px] w-[18px] -translate-y-px"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            )}
          </button>

          {showCounter && (
            <p
              className={cn(
                "px-0.5 text-[10px] tabular-nums",
                text.length > MAX_LENGTH ? "text-red-600" : "text-slate-400"
              )}
            >
              {text.length}/{MAX_LENGTH}
            </p>
          )}
        </div>
      </div>

      <p className="mt-1.5 hidden px-1 text-[11px] text-slate-400 sm:block">
        {isCoarsePointer
          ? "Enter adds a new line on touch devices."
          : "Press Enter to send, Shift + Enter for a new line."}
      </p>
    </form>
  );
}
