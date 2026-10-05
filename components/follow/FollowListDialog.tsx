"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import { AlertCircle, Loader2, Users, X } from "lucide-react";
import { followsApi, getUserFacingError } from "@/lib/api";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { useAuth } from "@/contexts/AuthContext";
import {
  FOLLOWERS_QUERY_KEY,
  FOLLOWING_QUERY_KEY,
} from "@/hooks/useFollow";
import type { FollowListResult } from "@/types";
import FollowButton from "@/components/follow/FollowButton";
import UserIdentity from "@/components/social/UserIdentity";

interface FollowListDialogProps {
  kind: "followers" | "following";
  targetUserId: string;
  onClose: () => void;
}

/**
 * Cursor-paginated modal showing a user's followers or following list.
 * Each row renders public-safe identity data plus a per-row FollowButton
 * seeded from the server-provided `isFollowingByViewer` (no extra requests).
 */
export default function FollowListDialog({
  kind,
  targetUserId,
  onClose,
}: FollowListDialogProps) {
  const { getToken, isAuthenticated } = useFirebaseToken();
  const { user: currentUser } = useAuth();
  const viewerUid = currentUser?.uid ?? null;

  const listKey = kind === "followers" ? FOLLOWERS_QUERY_KEY : FOLLOWING_QUERY_KEY;

  const list = useInfiniteQuery<
    FollowListResult,
    Error,
    InfiniteData<FollowListResult, string | null>,
    readonly [string, string],
    string | null
  >({
    queryKey: listKey(targetUserId),
    queryFn: async ({ pageParam }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return kind === "followers"
        ? followsApi.getFollowers(targetUserId, token, pageParam ?? undefined)
        : followsApi.getFollowing(targetUserId, token, pageParam ?? undefined);
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: isAuthenticated && !!targetUserId,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rows = list.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="follow-list-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id="follow-list-title" className="text-lg font-bold text-slate-900">
            {kind === "followers" ? "Followers" : "Following"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {list.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading
            </div>
          ) : list.isError ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-sm text-red-400">
                {getUserFacingError(list.error)}
              </p>
              <button
                onClick={() => void list.refetch()}
                className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
              >
                Retry
              </button>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <Users className="h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-500">
                {kind === "followers"
                  ? "No followers yet."
                  : "Not following anyone yet."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {rows.map((row) => {
                const isViewer = row.uid === viewerUid;
                return (
                  <li key={row.uid} className="flex items-center gap-3 px-5 py-3">
                    <Link
                      href={`/users/${row.username}`}
                      onClick={onClose}
                      className="group flex min-w-0 flex-1 items-center gap-3"
                    >
                      {/* Same identity rendering as everywhere else, so a user
                          with no display name shows "@username" rather than a
                          bare username. */}
                      <div className="min-w-0">
                        {/* Same identity rendering as everywhere else, so a user
                            with no display name shows "@username" rather than a
                            bare username. */}
                        <UserIdentity
                          username={row.username}
                          displayName={row.displayName}
                          photoUrl={row.photoUrl}
                          avatarSize={40}
                          linkToProfile={false}
                          className="min-w-0"
                          nameClassName="text-sm font-semibold text-slate-900 group-hover:text-[#2563EB]"
                        />
                        {row.bio ? (
                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {row.bio}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                    {isViewer ? (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                        You
                      </span>
                    ) : (
                      <FollowButton
                        userId={row.uid}
                        displayName={row.displayName || row.username}
                        initialIsFollowing={row.isFollowingByViewer}
                        size="sm"
                        className="shrink-0"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {list.hasNextPage && (
          <div className="border-t border-slate-200 p-3">
            <button
              onClick={() => void list.fetchNextPage()}
              disabled={list.isFetchingNextPage}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-60"
            >
              {list.isFetchingNextPage ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading…
                </>
              ) : (
                "Load more"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}