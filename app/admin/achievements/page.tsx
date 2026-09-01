"use client";

import { useQuery } from "@tanstack/react-query";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { adminApi } from "@/lib/api";
import type { AdminAchievementRow } from "@/types";
import { Loader2, AlertCircle, RotateCcw, Unlock } from "lucide-react";
import { AchievementGlyph } from "@/lib/iconMapper";

const CATEGORY_COLORS: Record<string, string> = {
  Habit: "bg-[#10B981]/10",
  Level: "bg-[#2563EB]/10",
  XP: "bg-amber-100",
  Streak: "bg-orange-100",
  Special: "bg-purple-100",
};

export default function AdminAchievementsPage() {
  const { getToken } = useFirebaseToken();

  const {
    data: achievements = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<AdminAchievementRow[], Error>({
    queryKey: ["admin-achievements"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return adminApi.getAchievements(token);
    },
    enabled: !!getToken,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-sm text-red-400">{error?.message ?? "Failed to load achievements"}</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
        >
          <RotateCcw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Achievement Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage achievements and their unlock criteria.
        </p>
      </div>

      {achievements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-center">
          <Unlock className="mb-3 h-10 w-10 text-slate-400" />
          <p className="text-sm font-medium text-slate-500">No achievements found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className="rounded-xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-[#2563EB] ${CATEGORY_COLORS[ach.category] ?? "bg-slate-100"}`}
                >
                  <AchievementGlyph icon={ach.icon} className="h-6 w-6" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#10B981]/10 px-2.5 py-0.5 text-xs font-medium text-[#10B981]">
                  <Unlock className="h-3 w-3" />
                  Active
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                {ach.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{ach.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <div>
                  <p className="text-xs text-slate-400">Unlocked by</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {ach.unlockedCount.toLocaleString()} users
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Target</p>
                  <p className="text-sm font-semibold text-amber-600">
                    {ach.target}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
