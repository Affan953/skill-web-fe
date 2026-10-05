"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFacingError } from "@/lib/api";
import { useCreateConversation } from "@/hooks/useConversations";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { cn } from "@/lib/cn";

/**
 * "Message" entry point for another user's public profile.
 *
 * Only ever rendered by the profile for a NON-self viewer, so there is no
 * one-tap path to a conversation with yourself.
 *
 * The conversation is created lazily — on click, not on page render — so merely
 * looking at a profile never writes to Firestore. Creation is get-or-create, so
 * tapping this on a profile that already has a conversation just opens it.
 */
export function MessageButton({
  userId,
  displayName,
  className,
}: {
  userId: string;
  displayName: string;
  className?: string;
}) {
  const router = useRouter();
  const { isAuthenticated } = useFirebaseToken();
  const createConversation = useCreateConversation();
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated) return null;

  const isPending = createConversation.isPending;

  async function handleClick() {
    setError(null);
    try {
      const conversation = await createConversation.mutateAsync(userId);
      router.push(`/messages/${encodeURIComponent(conversation.id)}`);
    } catch (err) {
      setError(getUserFacingError(err));
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5",
          "text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-60"
        )}
      >
        {isPending ? (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
            aria-hidden="true"
          />
        ) : (
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 01-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 01-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
        )}
        {isPending ? "Opening…" : `Message ${displayName}`}
      </button>

      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
