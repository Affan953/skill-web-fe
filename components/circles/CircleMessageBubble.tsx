"use client";

import Avatar from "@/components/Avatar";
import { fullTimestampLabel, timeOfDayLabel } from "@/lib/messageTime";
import { cn } from "@/lib/cn";
import type { ThreadCircleMessage } from "@/types";

/**
 * One entry of a circle discussion: an optional day separator, the avatar, the
 * name, the bubble and — once per group — the timestamp.
 *
 * Circles are group chats, so unlike a DM a message that starts a group shows the
 * sender's name above the bubble. The name and photo are resolved from the circle
 * membership the viewer has already loaded (see `useCircleMembers`); a message
 * whose sender cannot be resolved renders an anonymous slot rather than leaking
 * a raw uid.
 *
 * A moderated-away message is rendered as a muted notice instead of its text,
 * because the text is gone from the document and must not be replayed. The text
 * is otherwise rendered as a plain string inside a `<p>`; React escapes it and
 * there is no `dangerouslySetInnerHTML` anywhere in the message path.
 */
export function CircleMessageBubble({
  message,
  isMine,
  isGroupStart,
  isGroupEnd,
  dayLabel,
  sender,
  entering,
  canModerate,
  isModerating,
  onModerateDelete,
}: {
  message: ThreadCircleMessage;
  isMine: boolean;
  isGroupStart: boolean;
  isGroupEnd: boolean;
  dayLabel?: string | null;
  sender: { photoUrl?: string | null; displayName: string } | null | undefined;
  entering: boolean;
  canModerate?: boolean;
  isModerating?: boolean;
  onModerateDelete?: (messageId: string) => void;
}) {
  const time = timeOfDayLabel(message.createdAt);
  const fullTime = fullTimestampLabel(message.createdAt);

  if (message.isDeleted) {
    return (
      <li data-testid="circle-message" data-message-id={message.id} className="my-1">
        {dayLabel && (
          <p className="my-4 flex items-center gap-3 text-[11px] font-medium text-slate-400">
            <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
            {dayLabel}
            <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
          </p>
        )}
        <p className="flex items-center gap-1.5 px-1 text-xs italic text-slate-300">
          <svg
            className="h-3.5 w-3.5 shrink-0 text-slate-200"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.6}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3a9 9 0 109 9h-9V3z"
            />
          </svg>
          This message was removed by a moderator
        </p>
      </li>
    );
  }

  return (
    <li
      data-testid="circle-message"
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
            {isGroupStart && sender ? (
              <Avatar
                src={sender.photoUrl}
                name={sender.displayName}
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
          {isGroupStart && !isMine && sender ? (
            <p className="mb-0.5 px-1 text-[11px] font-medium text-slate-400">
              {sender.displayName}
            </p>
          ) : null}

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
            <div className="mt-1 flex items-center gap-1.5 px-1">
              <time
                dateTime={message.createdAt}
                title={fullTime}
                className="text-[10px] tabular-nums text-slate-400"
              >
                {message.pending ? "Sending…" : time}
              </time>
              {canModerate && !message.pending && onModerateDelete ? (
                <button
                  type="button"
                  disabled={isModerating}
                  onClick={() => onModerateDelete(message.id)}
                  className="rounded px-1 py-0.5 text-[10px] font-medium text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-60"
                >
                  {isModerating ? "Removing…" : "Remove"}
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}