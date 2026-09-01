"use client";

import { useMemo, useState } from "react";
import PlaceholderCard from "@/components/PlaceholderCard";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { leaderboardApi } from "@/lib/api";
import type { LeaderboardEntry } from "@/types";
import {
  Trophy,
  Search,
  Lock,
  RotateCcw,
  AlertCircle,
  Flame,
  Zap,
  Crown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { MedalGlyph } from "@/lib/iconMapper";

const FILTER_OPTIONS = [10, 25, 50, 100] as const;

function SkeletonRow() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-4">
        <div className="h-5 w-5 rounded bg-slate-100" />
        <div className="h-10 w-10 rounded-full bg-slate-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 rounded bg-slate-100" />
          <div className="h-3 w-1/4 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-white py-16 text-center">
      <AlertCircle className="mb-3 h-10 w-10 text-red-400" />
      <p className="mb-4 text-sm text-red-400">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
      >
        <RotateCcw className="h-4 w-4" />
        Retry
      </button>
    </div>
  );
}

function PodiumCard({
  entry,
  highlight,
}: {
  entry: LeaderboardEntry;
  highlight: boolean;
}) {
  const isFirst = entry.rank === 1;
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border p-6 transition-all hover:scale-[1.02] hover:shadow-lg",
        isFirst
          ? "border-amber-300/40 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50"
          : entry.rank === 2
            ? "border-slate-300/30 bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100"
            : "border-orange-300/30 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50",
        highlight && "ring-2 ring-amber-400/50 shadow-md shadow-amber-100"
      )}
    >
      <MedalGlyph rank={entry.rank} className="mb-2 h-8 w-8" />
      <div
        className={cn(
          "mb-3 flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white",
          isFirst ? "bg-gradient-to-br from-amber-400 to-yellow-500" : entry.rank === 2 ? "bg-gradient-to-br from-slate-400 to-blue-400" : "bg-gradient-to-br from-orange-400 to-amber-500"
        )}
      >
        {entry.displayName.charAt(0).toUpperCase()}
      </div>
      <h3
        className={cn(
          "text-sm font-semibold",
          highlight ? "text-amber-600" : "text-slate-900"
        )}
      >
        {entry.displayName}
      </h3>
      {highlight && (
        <span className="mt-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
          You
        </span>
      )}
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-amber-500" />
          {entry.xp.toLocaleString()}
        </span>
        <span>Lv.{entry.level}</span>
        <span className="flex items-center gap-1">
          <Flame className="h-3 w-3 text-orange-500" />
          {entry.streak}
        </span>
      </div>
    </div>
  );
}

function LeaderboardContent() {
  const { getToken } = useFirebaseToken();
  const { user } = useAuth();

  const {
    data: allEntries = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<LeaderboardEntry[], Error>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return leaderboardApi.getAll(token);
    },
    enabled: !!getToken,
  });

  const { data: myRank } = useQuery<LeaderboardEntry, Error>({
    queryKey: ["leaderboard", "me"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return leaderboardApi.getMe(token);
    },
    enabled: !!getToken,
  });

  const [search, setSearch] = useState("");
  const [filterLimit, setFilterLimit] = useState<number>(100);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    let result = allEntries.slice(0, filterLimit);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) =>
        e.displayName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allEntries, filterLimit, search]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const top3 = useMemo(
    () => allEntries.filter((e) => e.rank <= 3).sort((a, b) => a.rank - b.rank),
    [allEntries]
  );

  const podiumIds = useMemo(() => new Set(top3.map((e) => e.uid)), [top3]);

  const nonPodiumEntries = useMemo(
    () => paginated.filter((e) => !podiumIds.has(e.uid)),
    [paginated, podiumIds]
  );

  return (
    <div className="flex-1 px-6 py-8">
      {/* Header */}
      <section className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Leaderboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          See how you rank against other users.
        </p>
      </section>

          {isLoading ? (
            <>
              {/* Summary skeleton */}
              <section className="mb-8">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse rounded-xl border border-slate-200 bg-white p-6"
                    >
                      <div className="h-4 w-1/3 rounded bg-slate-100" />
                      <div className="mt-3 h-8 w-1/2 rounded bg-slate-100" />
                      <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
              </section>
              {/* Podium skeleton */}
              <section className="mb-8">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 text-center"
                    >
                      <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-slate-100" />
                      <div className="mx-auto h-4 w-1/2 rounded bg-slate-100" />
                      <div className="mx-auto mt-2 h-3 w-1/3 rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
              </section>
              {/* List skeleton */}
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            </>
          ) : isError ? (
            <ErrorState
              message={error?.message ?? "Failed to load leaderboard"}
              onRetry={() => refetch()}
            />
          ) : allEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-50">
                <Trophy className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-500">
                No leaderboard data available.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Complete habits to earn XP and climb the ranks!
              </p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <section className="mb-8">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <PlaceholderCard
                    title="My Rank"
                    value={myRank ? `#${myRank.rank}` : "—"}
                    description={
                      myRank
                        ? `Out of ${allEntries.length} players`
                        : "Not ranked yet"
                    }
                    icon={<Crown className="h-5 w-5" />}
                  />
                  <PlaceholderCard
                    title="My XP"
                    value={user?.xp?.toLocaleString() ?? "0"}
                    description="Experience points"
                    icon={<Zap className="h-5 w-5" />}
                  />
                  <PlaceholderCard
                    title="My Level"
                    value={user?.level ?? 1}
                    description="Current level"
                    icon={<Trophy className="h-5 w-5" />}
                  />
                  <PlaceholderCard
                    title="My Streak"
                    value={user?.currentStreak ?? 0}
                    description={
                      (user?.currentStreak ?? 0) === 1
                        ? "Day in a row"
                        : "Days in a row"
                    }
                    icon={<Flame className="h-5 w-5" />}
                  />
                </div>
              </section>

              {/* Top 3 Podium */}
              {top3.length > 0 && (
                <section className="mb-8">
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Top Players
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {top3.map((entry) => (
                      <PodiumCard
                        key={entry.uid}
                        entry={entry}
                        highlight={entry.uid === user?.uid}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Search & Filter */}
              <section className="mb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by username..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 sm:w-64"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {FILTER_OPTIONS.map((limit) => (
                      <button
                        key={limit}
                        onClick={() => {
                          setFilterLimit(limit);
                          setPage(1);
                        }}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                          filterLimit === limit
                            ? "bg-amber-500 text-white"
                            : "bg-white text-slate-500 hover:bg-slate-100"
                        )}
                      >
                        Top {limit}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Leaderboard Table — Desktop */}
              <section className="hidden md:block">
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  {/* Table header */}
                  <div className="grid grid-cols-[60px_1fr_100px_100px_120px_100px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Rank
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Player
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Level
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      XP
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Streak
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </span>
                  </div>

                  {/* Non-podium rows */}
                  {nonPodiumEntries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Lock className="mb-3 h-6 w-6 text-slate-400" />
                      <p className="text-sm text-slate-400">
                        {search
                          ? "No players match your search"
                          : "No more players to display"}
                      </p>
                    </div>
                  ) : (
                    nonPodiumEntries.map((entry) => {
                      const isMe = entry.uid === user?.uid;
                      return (
                        <div
                          key={entry.uid}
                          className={cn(
                            "grid grid-cols-[60px_1fr_100px_100px_120px_100px] items-center gap-4 border-b border-slate-200 px-4 py-3 transition-colors last:border-b-0 hover:bg-white",
                            isMe && "bg-amber-50"
                          )}
                        >
                          <span className="text-sm font-bold text-slate-500">
                            {entry.rank}
                          </span>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-sm font-semibold text-white">
                              {entry.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p
                                className={cn(
                                  "truncate text-sm font-semibold",
                                  isMe ? "text-amber-600" : "text-slate-900"
                                )}
                              >
                                {entry.displayName}
                              </p>
                              {isMe && (
                                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-slate-500">
                            Lv. {entry.level}
                          </span>
                          <span className="flex items-center gap-1 text-sm text-slate-500">
          <Zap className="h-3 w-3 text-amber-500" />
                            {entry.xp.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1 text-sm text-slate-500">
                            <Flame className="h-3 w-3 text-orange-500" />
                            {entry.streak}
                          </span>
                          <span
                            className={cn(
                              "w-fit rounded-full px-2 py-0.5 text-[10px] font-medium",
                              isMe
                                ? "bg-amber-100 text-amber-600"
                                : "bg-slate-100 text-slate-500"
                            )}
                          >
                            {isMe ? "You" : `#${entry.rank}`}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {/* Leaderboard List — Mobile */}
              <section className="space-y-3 md:hidden">
                {nonPodiumEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-12 text-center">
                    <Lock className="mb-3 h-6 w-6 text-slate-400" />
                    <p className="text-sm text-slate-400">
                      {search
                        ? "No players match your search"
                        : "No more players to display"}
                    </p>
                  </div>
                ) : (
                  nonPodiumEntries.map((entry) => {
                    const isMe = entry.uid === user?.uid;
                    return (
                      <div
                        key={entry.uid}
                        className={cn(
                          "flex items-center gap-4 rounded-xl border p-4 transition-colors",
                          isMe
                            ? "border-amber-300/40 bg-amber-50"
                            : "border-slate-200 bg-white"
                        )}
                      >
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-sm font-bold text-slate-500">
                          {entry.rank}
                        </div>
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-sm font-semibold text-white">
                          {entry.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4
                              className={cn(
                                "truncate text-sm font-semibold",
                                isMe ? "text-amber-600" : "text-slate-900"
                              )}
                            >
                              {entry.displayName}
                            </h4>
                            {isMe && (
                              <span className="flex-shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                                You
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-3">
                            <span className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Zap className="h-3 w-3" />
                              {entry.xp.toLocaleString()} XP
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Lv. {entry.level}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-slate-500">
          <Flame className="h-3 w-3 text-orange-500" />
                              {entry.streak}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </section>

              {/* Pagination */}
              {totalPages > 1 && (
                <section className="mt-6 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-3 text-sm text-slate-500">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </section>
              )}
            </>
          )}
    </div>
  );
}

export default function LeaderboardPage() {
  return <LeaderboardContent />;
}
