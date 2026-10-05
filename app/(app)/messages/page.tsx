"use client";

import { ConversationListPane } from "@/components/messaging/ConversationListPane";

/**
 * Messages inbox.
 *
 * Desktop is a two-pane layout: the list on the left, an invitation to pick a
 * conversation on the right. On mobile the list stands alone and tapping a row
 * navigates to `/messages/[conversationId]`, which hides the list and gives the
 * thread the whole screen — so a phone never renders two panes at once.
 *
 * The height is the viewport minus the sticky top bar (h-16), expressed in
 * `dvh` so a mobile browser's collapsing address bar does not push the composer
 * off screen.
 */
export default function MessagesPage() {
  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-6xl flex-col px-3 pb-3 sm:px-5 lg:px-6 lg:pb-5">
      <header className="shrink-0 pb-3 pt-4 sm:pt-5">
        <h1 className="text-xl font-semibold text-slate-900">Messages</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Private conversations with people you follow and grow alongside.
        </p>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[340px_1fr] xl:grid-cols-[360px_1fr]">
        <div className="min-h-0 overflow-hidden lg:border-r lg:border-slate-200/80">
          <ConversationListPane />
        </div>

        {/* Right pane: desktop only, since mobile navigates instead. */}
        <div className="hidden min-h-0 flex-col items-center justify-center bg-slate-50/60 px-6 text-center lg:flex">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563EB]/10">
            <svg
              className="h-7 w-7 text-[#2563EB]"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
              />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-900">
            Select a conversation
          </p>
          <p className="mt-1 max-w-xs text-sm text-slate-500">
            Choose someone on the left to read your messages, or start a new
            conversation from their profile.
          </p>
        </div>
      </div>
    </div>
  );
}
