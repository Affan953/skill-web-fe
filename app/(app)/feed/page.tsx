"use client";

import { AlertCircle, Loader2, RefreshCw, Rss } from "lucide-react";
import Link from "next/link";
import { useGrowthFeed } from "@/hooks/useGrowthFeed";
import { useFollow } from "@/hooks/useFollow";
import { useAuth } from "@/contexts/AuthContext";
import GrowthFeedCard from "@/components/social/GrowthFeedCard";

const SKELETON_ITEMS = [0, 1, 2, 3];

function FeedSkeleton() {
  return (
    <ul className="space-y-3" aria-hidden="true">
      {SKELETON_ITEMS.map((i) => (
        <li
          key={i}
          className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4"
        >
          <div className="flex items-start gap-3">
            <span className="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
            <span className="flex-1 space-y-2.5">
              <span className="block h-3 w-3/4 rounded bg-slate-200" />
              <span className="block h-3 w-1/3 rounded bg-slate-200" />
            </span>
          </div>
          <div className="ml-[3.25rem] mt-3 flex gap-1.5 border-t border-slate-100 pt-3">
            <span className="h-7 w-12 rounded-full bg-slate-200" />
            <span className="h-7 w-12 rounded-full bg-slate-200" />
            <span className="h-7 w-12 rounded-full bg-slate-200" />
            <span className="h-7 w-12 rounded-full bg-slate-200" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function FeedPage() {
  const { user } = useAuth();
  const viewerUid = user?.uid ?? null;

  const feed = useGrowthFeed();
  const { counts } = useFollow(viewerUid, { includeCounts: true });

  const items = feed.data?.pages.flatMap((page) => page.items) ?? [];

  const renderEmpty = () => {
    const followingCount = counts?.followingCount ?? 0;
    return followingCount === 0 ? (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-14 text-center">
        <Rss className="h-10 w-10 text-slate-300" />
        <div>
          <p className="text-sm font-semibold text-slate-700">
            Your growth feed is quiet.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Follow other learners to see their habits, streaks, achievements,
            and quests here.
          </p>
        </div>
        <Link
          href="/discover"
          className="mt-1 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
        >
          Find people to follow
        </Link>
      </div>
    ) : (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-14 text-center">
        <Rss className="h-10 w-10 text-slate-300" />
        <div>
          <p className="text-sm font-semibold text-slate-700">
            No new growth activity yet.
          </p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Complete a habit or a daily quest and it will show up here — your
            progress is real, and your followers can cheer you on.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-2xl flex-1 px-6 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Growth Feed</h1>
          <p className="mt-1 text-sm text-slate-500">
            Recent growth from you and the people you follow.
          </p>
        </div>
        <button
          onClick={() => void feed.refetch()}
          disabled={feed.isRefetching}
          aria-label="Refresh feed"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-[#2563EB]/40 hover:text-[#2563EB] disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${feed.isRefetching ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="space-y-3">
        {feed.isLoading ? (
          <FeedSkeleton />
        ) : feed.isError ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-14 text-center"
          >
            <AlertCircle className="h-8 w-8 text-red-400" />
            <div>
              <p className="text-sm font-semibold text-red-500">
                Couldn&apos;t load your growth feed.
              </p>
              <p className="mt-1 text-sm text-red-400">
                Something went wrong while loading the latest activity. Please
                try again.
              </p>
            </div>
            <button
              onClick={() => void feed.refetch()}
              className="mt-1 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          renderEmpty()
        ) : (
          <ul className="space-y-3">
            {items.map((item, index) => (
              <li
                key={item.id}
                className="feed-card-in"
                style={{ animationDelay: `${Math.min(index * 50, 250)}ms` }}
              >
                <GrowthFeedCard item={item} isSelf={item.user.uid === viewerUid} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {feed.hasNextPage && !feed.isLoading && (
        <div className="mt-6">
          <button
            onClick={() => void feed.fetchNextPage()}
            disabled={feed.isFetchingNextPage}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            {feed.isFetchingNextPage ? (
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
  );
}