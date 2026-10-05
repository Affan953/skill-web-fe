"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, RotateCcw, ShieldOff, UserX } from "lucide-react";
import Avatar from "@/components/Avatar";
import { useBlockedUsers } from "@/hooks/useSafety";
import { formatShortDate } from "@/lib/format";

/**
 * "Blocked users" section for Settings → Privacy.
 *
 * Explains what a block actually does before offering the unblock button,
 * because the two halves of the product promise differ and users conflate them:
 * blocking severs the follow relationship but deliberately leaves existing
 * messages, comments and circle memberships alone. Saying so here is what stops
 * "I blocked them and they can still see my comment" from reading as a bug.
 */
export default function BlockedUsersPanel() {
  const {
    items,
    hasMore,
    isLoadingNext,
    loadMore,
    isLoading,
    isError,
    refetch,
    unblock,
    unblockingUsername,
    unblockError,
    listError,
  } = useBlockedUsers();

  // Confirmation is per-username rather than a global "are you sure" so the
  // user can see exactly which row they are about to act on.
  const [pendingUnblock, setPendingUnblock] = useState<string | null>(null);
  const [justUnblocked, setJustUnblocked] = useState<string | null>(null);

  const confirmUnblock = async (username: string) => {
    setPendingUnblock(null);
    try {
      await unblock(username);
      setJustUnblocked(username);
      window.setTimeout(() => setJustUnblocked(null), 4000);
    } catch {
      // Surfaced through `unblockError` below; nothing to do here.
    }
  };

  return (
    <div className="mt-4">
      <p className="mb-3 text-xs leading-relaxed text-slate-500">
        Blocked people can’t follow you, message you, react or comment on your
        growth activities, or see you in search and the growth feed. Any existing
        follows are removed. Messages and comments from before the block are not
        deleted.
      </p>

      {unblockError && (
        <p role="alert" className="mb-3 text-sm text-red-500">
          {unblockError}
        </p>
      )}
      {justUnblocked && (
        <p
          role="status"
          className="mb-3 text-sm text-emerald-600"
        >
          @{justUnblocked} has been unblocked.
        </p>
      )}

      {isLoading ? (
        <div className="space-y-2" aria-busy="true" aria-live="polite">
          <span className="sr-only">Loading blocked users</span>
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-500/20 bg-red-50/40 px-4 py-6 text-center">
          <p className="text-sm text-red-500">{listError}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
          You haven’t blocked anyone.
        </p>
      ) : (
        <>
          <ul className="space-y-2">
            {items.map((user) => {
              const isBusy = unblockingUsername === user.username;
              const isConfirming = pendingUnblock === user.username;
              return (
                <li
                  key={user.username}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                      name={user.displayName || user.username}
                      src={user.photoUrl}
                      size={40}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {user.displayName}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        @{user.username}
                        {user.blockedAt
                          ? ` · blocked ${formatShortDate(user.blockedAt)}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  {isConfirming ? (
                    <div
                      className="flex shrink-0 items-center gap-2"
                      role="group"
                      aria-label={`Confirm unblocking @${user.username}`}
                    >
                      <button
                        type="button"
                        onClick={() => confirmUnblock(user.username)}
                        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingUnblock(null)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPendingUnblock(user.username)}
                      disabled={unblockingUsername !== null}
                      aria-label={`Unblock @${user.username}`}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
                    >
                      {isBusy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ShieldOff className="h-3.5 w-3.5" />
                      )}
                      Unblock
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {hasMore && (
            <button
              type="button"
              onClick={() => loadMore()}
              disabled={isLoadingNext}
              className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              {isLoadingNext ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading…
                </span>
              ) : (
                "Show more"
              )}
            </button>
          )}
        </>
      )}

      <p className="mt-4 flex items-start gap-2 text-[11px] text-slate-400">
        <UserX className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Unblocking does not restore follows automatically — you can follow again
          whenever you like. To stop someone without cutting contact entirely,{" "}
          <Link
            href="/settings"
            className="underline underline-offset-2 hover:text-slate-600"
          >
            report them instead
          </Link>
          .
        </span>
      </p>
    </div>
  );
}
