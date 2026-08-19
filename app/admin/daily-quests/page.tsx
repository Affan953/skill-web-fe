"use client";

import { useQuery } from "@tanstack/react-query";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { adminApi } from "@/lib/api";
import type { AdminQuestRow } from "@/types";
import {
  Target,
  Clock,
  Trophy,
  TrendingUp,
  Loader2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  Habit: "bg-purple-100 text-purple-500",
  XP: "bg-amber-100 text-amber-500",
  Streak: "bg-orange-100 text-orange-500",
};

function getCompletionRate(quest: AdminQuestRow): number {
  if (quest.totalAssigned === 0) return 0;
  return Math.round((quest.totalCompleted / quest.totalAssigned) * 100);
}

export default function AdminDailyQuestsPage() {
  const { getToken } = useFirebaseToken();

  const {
    data: quests = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<AdminQuestRow[], Error>({
    queryKey: ["admin-daily-quests"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return adminApi.getDailyQuests(token);
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
        <p className="text-sm text-red-400">{error?.message ?? "Failed to load daily quests"}</p>
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
          Daily Quest Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage daily quests and challenges.
        </p>
      </div>

      {quests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-center">
          <Target className="mb-3 h-10 w-10 text-slate-400" />
          <p className="text-sm font-medium text-slate-500">No daily quests found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quests.map((quest) => {
            const completionRate = getCompletionRate(quest);
            return (
              <div
                key={quest.id}
                className="rounded-xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${CATEGORY_COLORS[quest.category] ?? "bg-slate-100 text-slate-500"}`}
                  >
                    <Target className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center rounded-full bg-[#10B981]/10 px-2.5 py-0.5 text-xs font-medium text-[#10B981]">
                    Active
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  {quest.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{quest.description}</p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-amber-600">
                      <Trophy className="h-3.5 w-3.5" />
                      <span className="text-sm font-semibold">{quest.rewardXP} XP</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-400">Reward</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-700">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span className="text-sm font-semibold">
                        {completionRate}%
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-400">Completion</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-500">
                    Target: {quest.target}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    {quest.totalAssigned} assigned / {quest.totalCompleted} done
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
