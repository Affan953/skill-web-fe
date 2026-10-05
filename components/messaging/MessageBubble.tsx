"use client";

import Avatar from "@/components/Avatar";
import { fullTimestampLabel, timeOfDayLabel } from "@/lib/messageTime";
import { cn } from "@/lib/cn";
import type { ThreadMessage } from "@/types";

/**
 * One entry of a conversation: an optional day separator, the avatar, the bubble
 * and — once per group — the timestamp.
 *
 * Grouping is the reason this is a row and not just a bubble. Consecutive
 * messages from one person share a single avatar and a single timestamp, shown
 * on the group's last message, so a burst of three short replies reads as three
 * lines of thought rather than three repeated avatars and three clocks.
 *
 * The text is rendered as a plain string inside a `<p>`; React escapes it and
 * there is no `dangerouslySetInnerHTML` anywhere in the message path, so a
 * message can never execute markup.
 */
export function MessageBubble({
  message,
  isMine,
  isGroupStart,
  isGroupEnd,
  dayLabel,
  otherUser,
  entering,
}: {
  message: ThreadMessage;
  isMine: boolean;
  isGroupStart: boolean;
  isGroupEnd: boolean;
  dayLabel?: string | null;
  otherUser: { photoUrl?: string | null; displayName: string } | null | undefined;
  entering: boolean;
}) {
  const time = timeOfDayLabel(message.createdAt);
  const fullTime = fullTimestampLabel(message.createdAt);

  return (
    <li
      data-testid="message"
      data-message-id={message.id}
      data-pending={message.pending ? "true" : "false"}
      className={cn(isGroupEnd ? "mb-2" : "mb-0.5")}
    >
      {dayLabel && (
        <p className="my-4 flex items-center gap-3 text-[11px] font-medium text-slate-400">
          <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
          {dayLabel}
          <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
        </p>
      )}

      <div
        className={cn(
          "flex items-end gap-2.5",
          isMine ? "justify-end" : "justify-start",
          entering && "message-in"
        )}
      >
        {!isMine && (
          <span className="w-8 shrink-0 self-end pb-0.5" aria-hidden="true">
            {isGroupStart && otherUser ? (
              <Avatar
                src={otherUser.photoUrl}
                name={otherUser.displayName}
                size={32}
              />
            ) : null}
          </span>
        )}

        <div
          className={cn(
            "flex min-w-0 max-w-[82%] flex-col sm:max-w-[70%]",
            isMine ? "items-end" : "items-start"
          )}
        >
          <div
            className={cn(
              "whitespace-pre-wrap px-3.5 py-2 text-[15px] leading-relaxed shadow-sm [overflow-wrap:anywhere]",
              isMine
                ? "rounded-[18px] rounded-br-md bg-[#2563EB] text-white"
                : "rounded-[18px] rounded-bl-md border border-slate-200 bg-white text-slate-800",
              message.pending && "opacity-70"
            )}
          >
            <p>{message.text}</p>
          </div>

          {isGroupEnd && (
            <time
              dateTime={
                message.createdAt instanceof Date
                  ? message.createdAt.toISOString()
                  : message.createdAt
              }
              title={fullTime}
              className="mt-1 px-1 text-[10px] tabular-nums text-slate-400"
            >
              {message.pending ? "Sending…" : time}
            </time>
          )}
        </div>
      </div>
    </li>
  );
}
