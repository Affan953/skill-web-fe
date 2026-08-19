"use client";

import { useState } from "react";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dailyQuestsApi } from "@/lib/api";
import type { DailyQuest, DailyQuestCategory } from "@/types";
import { CalendarCheck, Loader2, CheckCircle2, RefreshCw, Zap } from "lucide-react";
import { cn } from "@/lib/cn";

const CATEGORY_LABELS: Record<DailyQuestCategory, string> = {
  Habit: "Habit",
  XP: "Experience",
  Streak: "Streak",
};

const CATEGORY_COLORS: Record<DailyQuestCategory, string> = {
  Habit: "bg-[#10B981]/10 text-[#10B981]",
  XP: "bg-[#2563EB]/10 text-[#2563EB]",
  Streak: "bg-[#10B981]/10 text-[#10B981]",
};

function DailyQuestsContent() {
  const { getToken } = useFirebaseToken();
  const queryClient = useQueryClient();

  const {
    data: quests = [],
    isLoading,
    isError,
    error,
  } = useQuery<DailyQuest[], Error>({
    queryKey: ["daily-quests"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return dailyQuestsApi.getToday(token);
    },
    enabled: !!getToken,
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return dailyQuestsApi.regenerate(token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-quests"] });
    },
  });

  const completedCount = quests.filter((q) => q.completed).length;
  const totalXP = quests
    .filter((q) => q.completed)
    .reduce((sum, q) => sum + q.rewardXP, 0);

  return (
    <div className="flex-1 px-6 py-8">
      <section className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Daily Quests
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Complete quests to earn bonus XP. Resets daily.
            </p>
          </div>
          <button
            onClick={() => regenerateMutation.mutate()}
            disabled={regenerateMutation.isPending}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                regenerateMutation.isPending && "animate-spin"
              )}
            />
            Regenerate
          </button>
        </div>
      </section>

          <section className="mb-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563EB]/10">
                    <CalendarCheck className="h-5 w-5 text-[#2563EB]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Quests Completed
                    </p>
                    <p className="text-xl font-bold text-slate-900">
                      {completedCount} / {quests.length}
                    </p>
                  </div>
                </div>
              </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#10B981]/10">
                    <Zap className="h-5 w-5 text-[#10B981]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      XP Earned Today
                    </p>
                    <p className="text-xl font-bold text-slate-900">
                      {totalXP}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-16 text-center">
                <p className="text-sm font-medium text-red-600">
                  {error?.message || "Failed to load quests"}
                </p>
              </div>
            ) : quests.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-center">
                <CalendarCheck className="mb-3 h-6 w-6 text-slate-400" />
                <p className="text-sm text-slate-400">
                  No quests available today
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {quests.map((quest) => {
                  const progressPct =
                    quest.target > 0
                      ? Math.min(
                          Math.round((quest.progress / quest.target) * 100),
                          100
                        )
                      : 0;

                  return (
                    <div
                      key={quest.id}
                      className={cn(
                        "rounded-xl border bg-white p-4 transition-colors",
                        quest.completed
                          ? "border-[#10B981]/20 opacity-75"
                          : "border-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
                              quest.completed
                              ? "bg-[#10B981]/10"
                              : "bg-slate-50"
                          )}
                        >
                          {quest.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                          ) : (
                            <CalendarCheck className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4
                              className={cn(
                                "text-sm font-semibold",
                                quest.completed
                                  ? "text-slate-500 line-through"
                                  : "text-slate-900"
                              )}
                            >
                              {quest.title}
                            </h4>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                                CATEGORY_COLORS[quest.category]
                              )}
                            >
                              {CATEGORY_LABELS[quest.category]}
                            </span>
                            <span className="rounded-full bg-[#2563EB]/10 px-2 py-0.5 text-[10px] font-medium text-[#2563EB]">
                              +{quest.rewardXP} XP
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {quest.description}
                          </p>
                          <div className="mt-2">
                            <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
                              <span>
                                {quest.progress} / {quest.target}
                              </span>
                              <span>{progressPct}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  quest.completed
                                    ? "bg-gradient-to-r from-[#10B981] to-[#10B981]/80"
                                    : "bg-gradient-to-r from-[#2563EB] to-[#60A5FA]"
                                )}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
    </div>
  );
}

export default function DailyQuestsPage() {
  return <DailyQuestsContent />;
}
