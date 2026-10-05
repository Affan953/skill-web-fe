"use client";

/**
 * Loading / empty / error states for the messaging surfaces.
 *
 * These follow the pattern already used by the notification inbox
 * (skeleton -> error -> empty -> content) so the two feel like one product, and
 * every error state offers a retry rather than a dead end.
 *
 * None of them invent content. An empty inbox points at Discover, an empty
 * thread asks for a first message, and a failure says so in a sentence a person
 * can act on — never a status code, a transport error or a stack trace.
 */

export function ConversationListSkeleton() {
  return (
    <div className="space-y-0.5 p-2 pt-0" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl p-2.5">
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-slate-200" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Thread placeholder for the very first load only.
 *
 * A background poll never renders this: `isLoading` is false once a thread has
 * rendered once, so refreshing never flashes a skeleton over live messages.
 */
export function MessagesSkeleton() {
  return (
    <div className="space-y-2 pt-2" aria-hidden="true">
      <div className="flex items-end gap-2.5">
        <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-slate-200" />
        <div className="h-10 w-2/5 animate-pulse rounded-[18px] rounded-bl-md bg-slate-200" />
      </div>
      <div className="flex items-end justify-end">
        <div className="h-10 w-3/5 animate-pulse rounded-[18px] rounded-br-md bg-blue-100" />
      </div>
      <div className="flex items-end justify-end">
        <div className="h-10 w-1/3 animate-pulse rounded-[18px] rounded-br-md bg-blue-100" />
      </div>
      <div className="flex items-end gap-2.5">
        <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-slate-200" />
        <div className="h-12 w-1/2 animate-pulse rounded-[18px] rounded-bl-md bg-slate-200" />
      </div>
      <div className="mt-4 h-11 w-full animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
    </div>
  );
}

/**
 * Empty inbox. Deliberately points at Discover rather than inventing sample
 * conversations — fake data in an inbox reads as real messages from real people.
 */
export function EmptyInbox({ onDiscover }: { onDiscover?: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563EB]/10">
        <svg
          className="h-7 w-7 text-[#2563EB]"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.6}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 01-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 01-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
          />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-slate-900">
        No conversations yet
      </h3>
      <p className="mt-1.5 max-w-xs text-sm text-slate-500">
        Connect with people who are working on their growth.
      </p>
      <button
        type="button"
        onClick={onDiscover}
        className="mt-6 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
      >
        Discover people
      </button>
    </div>
  );
}

/** A conversation that exists but has no messages yet. */
export function EmptyConversation({ name }: { name: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200/60">
        <svg
          className="h-7 w-7 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.6}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 01-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 01-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
          />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-slate-900">
        Start the conversation
      </h3>
      <p className="mt-1.5 max-w-xs text-sm text-slate-500">
        Say hello to {name} and start a meaningful conversation.
      </p>
    </div>
  );
}

export function MessagingError({
  message,
  onRetry,
  compact = false,
}: {
  message: string;
  onRetry: () => void;
  compact?: boolean;
}) {
  return (
    <div
      role="alert"
      className={`flex h-full flex-col items-center justify-center text-center ${
        compact ? "px-4 py-8" : "px-6 py-16"
      }`}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
        <svg
          className="h-6 w-6 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.7}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-slate-800">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
      >
        Try again
      </button>
    </div>
  );
}
