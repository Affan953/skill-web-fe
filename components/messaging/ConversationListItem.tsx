"use client";

import Avatar from "@/components/Avatar";
import { fullTimestampLabel, relativeTimeShort } from "@/lib/messageTime";
import type { Conversation } from "@/types";
import { cn } from "@/lib/cn";

/**
 * One row in the conversation list.
 *
 * Hierarchy does the work here rather than borders: an unread row is told apart
 * by a tinted surface, a heavier name, a bolder preview and a count badge, while
 * a read row recedes. The only chrome is the active row's accent bar — one
 * indicator, because two competing ones make a list look noisy.
 */
export function ConversationListItem({
  conversation,
  isActive,
  searchTerm,
  onSelect,
}: {
  conversation: Conversation;
  isActive: boolean;
  /** Echoed into the row's accessible name so a search result is announced. */
  searchTerm?: string;
  onSelect: (conversationId: string) => void;
}) {
  const { otherUser, lastMessage, unreadCount } = conversation;
  const isUnread = unreadCount > 0;

  const isOwnMessage = lastMessage?.senderId === otherUser.uid;
  const preview = lastMessage
    ? `${isOwnMessage ? "You: " : ""}${lastMessage.text}`
    : "No messages yet";

  const time = lastMessage?.createdAt ?? conversation.updatedAt;
  const timeLabel = relativeTimeShort(time);

  return (
    <button
      type="button"
      data-testid="conversation-row"
      data-conversation-id={conversation.id}
      data-unread={isUnread ? "true" : "false"}
      onClick={() => onSelect(conversation.id)}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        "group relative flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50",
        isActive
          ? "bg-white shadow-sm ring-1 ring-slate-200/80"
          : isUnread
            ? "bg-[#EFF6FF]/70 hover:bg-[#EFF6FF]"
            : "hover:bg-slate-100/70"
      )}
    >
      {isActive && (
        <span
          className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#2563EB]"
          aria-hidden="true"
        />
      )}

      <Avatar src={otherUser.photoUrl} name={otherUser.displayName} size={44} />

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm",
              isUnread
                ? "font-semibold text-slate-900"
                : "font-medium text-slate-700"
            )}
          >
            {otherUser.displayName}
          </span>
          <span
            title={fullTimestampLabel(time)}
            className={cn(
              "shrink-0 text-[11px] tabular-nums",
              isUnread ? "font-medium text-[#2563EB]" : "text-slate-400"
            )}
          >
            {timeLabel}
          </span>
        </span>

        <span className="mt-0.5 flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-xs",
              isUnread ? "font-medium text-slate-700" : "text-slate-500"
            )}
          >
            {preview}
          </span>

          {isUnread && (
            <span className="ml-auto inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-[#2563EB] px-1.5 text-[11px] font-semibold tabular-nums text-white">
              {/* The visible number is abbreviated at 100; this is the real count. */}
              <span aria-hidden="true">{unreadCount > 99 ? "99+" : unreadCount}</span>
              <span className="sr-only">
                {searchTerm
                  ? `${unreadCount} unread from ${otherUser.displayName}, matching ${searchTerm}`
                  : `${unreadCount} unread ${unreadCount === 1 ? "message" : "messages"} from ${otherUser.displayName}`}
              </span>
            </span>
          )}
        </span>
      </span>
    </button>
  );
}
