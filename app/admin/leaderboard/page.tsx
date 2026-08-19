"use client";

import { Trophy, Medal, Crown, Flame, Zap, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { leaderboardApi } from "@/lib/api";
import type { LeaderboardEntry } from "@/types";

interface LeaderboardUser {
  rank: number;
  username: string;
  initials: string;
  avatarBg: string;
  level: number;
  xp: number;
  streak: number;
}

const AVATAR_COLORS = [
  "bg-amber-500",
  "bg-[#2563EB]",
  "bg-purple-500",
  "bg-[#10B981]",
  "bg-orange-500",
  "bg-red-500",
  "bg-pink-500",
  "bg-teal-500",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function getAvatarBg(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function mapEntry(entry: LeaderboardEntry): LeaderboardUser {
  return {
    rank: entry.rank,
    username: entry.displayName,
    initials: getInitials(entry.displayName),
    avatarBg: getAvatarBg(entry.displayName),
    level: entry.level,
    xp: entry.xp,
    streak: entry.streak,
  };
}

function rankBadge(rank: number) {
  if (rank === 1)
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-md shadow-amber-200">
        <Crown className="h-5 w-5" />
      </div>
    );
  if (rank === 2)
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-md shadow-slate-200">
        <Medal className="h-5 w-5" />
      </div>
    );
  if (rank === 3)
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md shadow-orange-200">
        <Medal className="h-5 w-5" />
      </div>
    );
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
      {rank}
    </div>
  );
}

export default function AdminLeaderboardPage() {
  const { getToken } = useFirebaseToken();

  const {
    data: entries = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<LeaderboardEntry[]>({
    queryKey: ["admin-leaderboard"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return leaderboardApi.getAll(token);
    },
    enabled: !!getToken,
  });

  const users = entries.map(mapEntry);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-32">
        <p className="text-sm text-slate-500">Failed to load leaderboard.</p>
        <button
          onClick={() => refetch()}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Leaderboard Overview
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Top 10 users by XP earned.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {users.slice(0, 5).map((user) => (
          <div
            key={user.rank}
            className={`rounded-xl border bg-white p-5 text-center transition-all duration-200 hover:shadow-md ${
              user.rank === 1
                ? "border-amber-200 shadow-sm shadow-amber-100"
                : "border-slate-200"
            }`}
          >
            <div className="flex justify-center">{rankBadge(user.rank)}</div>
            <div
              className={`mx-auto mt-3 flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white ${user.avatarBg}`}
            >
              {user.initials}
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {user.username}
            </p>
            <div className="mt-3 flex items-center justify-center gap-4">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Zap className="h-3 w-3 text-amber-500" />
                {user.xp.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Trophy className="h-3 w-3 text-[#2563EB]" />
                Lv. {user.level}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Flame className="h-3 w-3 text-orange-500" />
                {user.streak}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Rank
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  User
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Level
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  XP
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Streak
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr
                  key={user.rank}
                  className="transition-colors hover:bg-slate-50/50"
                >
                  <td className="px-6 py-4">{rankBadge(user.rank)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${user.avatarBg}`}
                      >
                        {user.initials}
                      </div>
                      <span className="font-medium text-slate-900">
                        {user.username}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-[#2563EB]/10 px-2.5 py-0.5 text-xs font-semibold text-[#2563EB]">
                      Lv. {user.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-amber-600">
                    {user.xp.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Flame className="h-3.5 w-3.5 text-orange-500" />
                      {user.streak} days
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
