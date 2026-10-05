"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useConversations } from "@/hooks/useConversations";
import { getUserFacingError } from "@/lib/api";
import { ConversationListItem } from "./ConversationListItem";
import {
  ConversationListSkeleton,
  EmptyInbox,
  MessagingError,
} from "./messagingStates";

/**
 * Matches a loaded conversation on the three things someone would type.
 *
 * Deliberately local. A server-side search would need a new endpoint, a new
 * index and a second search system next to a list that is already paginated at
 * twenty rows, and it would answer a different question than the one a person
 * has when they are scanning a list they can already see.
 */
function matches(conversation: { otherUser: { displayName: string; username: string }; lastMessage: { text: string } | null }, term: string) {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;

  return (
    conversation.otherUser.displayName.toLowerCase().includes(needle) ||
    conversation.otherUser.username.toLowerCase().includes(needle) ||
    (conversation.lastMessage?.text.toLowerCase().includes(needle) ?? false)
  );
}

/**
 * The conversation list pane.
 *
 * Shared by `/messages` and `/messages/[conversationId]` so both routes render
 * the same list from one cache entry instead of duplicating the fetch.
 */
export function ConversationListPane({
  activeConversationId,
}: {
  activeConversationId?: string | null;
}) {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useConversations();
  const [search, setSearch] = useState("");

  const conversations = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  const visible = useMemo(
    () => conversations.filter((conversation) => matches(conversation, search)),
    [conversations, search]
  );

  // Never report "no results" for a list that is only partly loaded: that reads
  // as "these people do not exist" when the truth is "there are more pages".
  const searchIsPartial = search.trim().length > 0 && hasNextPage;

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50/60">
      <div className="shrink-0 border-b border-slate-200/80 p-3">
        <div className="relative">
          <label htmlFor="conversation-search" className="sr-only">
            Search conversations
          </label>
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            id="conversation-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search conversations..."
            autoComplete="off"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10"
          />
        </div>
      </div>

      {isLoading ? (
        <ConversationListSkeleton />
      ) : isError ? (
        <MessagingError
          compact
          message={getUserFacingError(error)}
          onRetry={() => void refetch()}
        />
      ) : conversations.length === 0 ? (
        <EmptyInbox onDiscover={() => router.push("/discover")} />
      ) : visible.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-sm font-medium text-slate-700">
            No conversations match &ldquo;{search.trim()}&rdquo;
          </p>
          <p className="mt-1 max-w-[15rem] text-xs text-slate-500">
            {searchIsPartial
              ? "Search covers the conversations loaded so far. Load more to widen it."
              : "Try a different name or a word from a recent message."}
          </p>
          {searchIsPartial && (
            <button
              type="button"
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
              className="mt-4 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            >
              {isFetchingNextPage ? "Loading…" : "Load more"}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            <ul className="space-y-0.5">
              {visible.map((conversation) => (
                <li key={conversation.id}>
                  <ConversationListItem
                    conversation={conversation}
                    isActive={conversation.id === activeConversationId}
                    searchTerm={search.trim() || undefined}
                    onSelect={(id) =>
                      router.push(`/messages/${encodeURIComponent(id)}`)
                    }
                  />
                </li>
              ))}
            </ul>

            {hasNextPage && (
              <button
                type="button"
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
                className="mt-2 w-full rounded-lg py-2 text-sm font-medium text-[#2563EB] transition-colors hover:bg-[#2563EB]/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] disabled:opacity-60"
              >
                {isFetchingNextPage ? "Loading…" : "Load more"}
              </button>
            )}
          </div>

          {search.trim() && (
            <p className="shrink-0 border-t border-slate-200/80 px-3 py-2 text-[11px] text-slate-400">
              {visible.length} of {conversations.length} loaded conversations
              {searchIsPartial ? " — more pages not searched" : ""}
            </p>
          )}
        </>
      )}
    </div>
  );
}
