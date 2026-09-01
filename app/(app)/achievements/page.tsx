"use client";

import { useMemo, useState } from "react";
import PlaceholderCard from "@/components/PlaceholderCard";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { useQuery } from "@tanstack/react-query";
import { achievementsApi } from "@/lib/api";
import type { Achievement, AchievementCategory } from "@/types";
import {
  Trophy,
  Lock,
  CheckCircle2,
  Search,
  X,
  RotateCcw,
  AlertCircle,
  Calendar,
  Target,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { AchievementGlyph } from "@/lib/iconMapper";

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  Habit: "Habit",
  Level: "Level",
  XP: "Experience",
  Streak: "Streak",
  Special: "Special",
};

type SortOption = "newest" | "oldest" | "xp" | "alpha" | "completion";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  oldest: "Oldest",
  xp: "Highest Target",
  alpha: "A → Z",
  completion: "Completion",
};

const STATUS_FILTERS = ["All", "Unlocked", "Locked"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function formatDate(date: string | Date | null): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-start justify-between">
        <div className="h-8 w-8 rounded-lg bg-slate-100" />
        <div className="h-5 w-5 rounded-full bg-slate-100" />
      </div>
      <div className="mb-1 h-4 w-2/3 rounded bg-slate-100" />
      <div className="mb-3 h-3 w-full rounded bg-slate-100" />
      <div className="mb-2 h-1.5 w-full rounded-full bg-slate-100" />
      <div className="h-5 w-16 rounded-full bg-slate-100" />
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
        className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
      >
        <RotateCcw className="h-4 w-4" />
        Retry
      </button>
    </div>
  );
}

function DetailModal({
  achievement,
  onClose,
}: {
  achievement: Achievement;
  onClose: () => void;
}) {
  const progressPct =
    achievement.target > 0
      ? Math.min(
          Math.round((achievement.progress / achievement.target) * 100),
          100,
        )
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563EB]/10 text-[#2563EB]">
            <AchievementGlyph icon={achievement.icon} className="h-7 w-7" />
          </span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="text-lg font-bold text-slate-900">
          {achievement.title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{achievement.description}</p>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Target className="h-4 w-4" />
              Requirements
            </div>
            <span className="text-sm font-medium text-slate-900">
              {achievement.target}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Trophy className="h-4 w-4" />
              Status
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                achievement.unlocked
                  ? "bg-[#10B981]/10 text-[#10B981]"
                  : "bg-slate-100 text-slate-500",
              )}
            >
              {achievement.unlocked ? "Unlocked" : "Locked"}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="h-4 w-4" />
              Unlock Date
            </div>
            <span className="text-sm text-slate-900">
              {achievement.unlocked
                ? formatDate(achievement.unlockedAt)
                : "Not yet unlocked"}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
            <span>
              Progress: {achievement.progress} / {achievement.target}
            </span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-[#2563EB] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function AchievementsContent() {
  const { getToken } = useFirebaseToken();

  const {
    data: achievements = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Achievement[], Error>({
    queryKey: ["achievements"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return achievementsApi.getAll(token);
    },
    enabled: !!getToken,
  });

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [categoryFilter, setCategoryFilter] = useState<
    AchievementCategory | "All"
  >("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);

  const filtered = useMemo(() => {
    let result = [...achievements];

    if (statusFilter === "Unlocked") {
      result = result.filter((a) => a.unlocked);
    } else if (statusFilter === "Locked") {
      result = result.filter((a) => !a.unlocked);
    }

    if (categoryFilter !== "All") {
      result = result.filter((a) => a.category === categoryFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q),
      );
    }

    result.sort((a, b) => {
      switch (sort) {
        case "newest":
          return (
            new Date(b.unlockedAt ?? 0).getTime() -
            new Date(a.unlockedAt ?? 0).getTime()
          );
        case "oldest":
          return (
            new Date(a.unlockedAt ?? 0).getTime() -
            new Date(b.unlockedAt ?? 0).getTime()
          );
        case "xp":
          return b.target - a.target;
        case "alpha":
          return a.title.localeCompare(b.title);
        case "completion": {
          const pctA = a.target > 0 ? a.progress / a.target : 0;
          const pctB = b.target > 0 ? b.progress / b.target : 0;
          return pctB - pctA;
        }
        default:
          return 0;
      }
    });

    return result;
  }, [achievements, statusFilter, categoryFilter, search, sort]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const lockedCount = achievements.length - unlockedCount;
  const completionPct =
    achievements.length > 0
      ? Math.round((unlockedCount / achievements.length) * 100)
      : 0;

  return (
    <div className="flex-1 px-6 py-8">
      {/* Header */}
      <section className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Achievements</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track your progress and unlock rewards.
        </p>
      </section>

          {/* Summary Cards */}
          <section className="mb-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <PlaceholderCard
                title="Unlocked"
                value={unlockedCount}
                description="Achievements earned"
                icon={<CheckCircle2 className="h-5 w-5" />}
              />
              <PlaceholderCard
                title="Locked"
                value={lockedCount}
                description="Remaining to unlock"
                icon={<Lock className="h-5 w-5" />}
              />
              <PlaceholderCard
                title="Completion"
                value={`${completionPct}%`}
                description={`${unlockedCount} of ${achievements.length}`}
                icon={<Trophy className="h-5 w-5" />}
              />
              <PlaceholderCard
                title="Total Target"
                value={achievements.reduce((s, a) => s + a.target, 0)}
                description="Combined requirements"
                icon={<Target className="h-5 w-5" />}
              />
            </div>
          </section>

          {/* Filters & Search */}
          <section className="mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Status filters */}
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      statusFilter === s
                        ? "bg-[#2563EB] text-white"
                        : "bg-white text-slate-500 hover:bg-slate-100",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search achievements..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] sm:w-64"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {/* Category filters */}
              {(
                ["All", "Habit", "Level", "XP", "Streak", "Special"] as const
              ).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    categoryFilter === cat
                      ? "bg-[#2563EB] text-white shadow-md"
                      : "bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700",
                  )}
                >
                  {cat === "All" ? "All Categories" : CATEGORY_LABELS[cat]}
                </button>
              ))}

              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="ml-auto rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 outline-none focus:border-[#2563EB]"
              >
                {Object.entries(SORT_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Achievement Grid */}
          <section>
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : isError ? (
              <ErrorState
                message={error?.message ?? "Failed to load achievements"}
                onRetry={() => refetch()}
              />
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-50">
                  <Trophy className="h-7 w-7 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-500">
                  {search
                    ? "No achievements match your search"
                    : "No achievements unlocked yet."}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Keep completing habits to earn achievements!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((achievement) => {
                  const progressPct =
                    achievement.target > 0
                      ? Math.min(
                          Math.round(
                            (achievement.progress / achievement.target) * 100,
                          ),
                          100,
                        )
                      : 0;

                  return (
                    <button
                      key={achievement.id}
                      onClick={() => setSelectedAchievement(achievement)}
                      className={cn(
                        "rounded-xl border bg-white p-5 text-left transition-all hover:scale-[1.02] hover:shadow-lg",
                        achievement.unlocked
                          ? "border-[#2563EB]/30 hover:border-[#2563EB]/50"
                          : "border-slate-200 opacity-75 hover:opacity-100",
                      )}
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
                          <AchievementGlyph icon={achievement.icon} className="h-6 w-6" />
                        </span>
                        {achievement.unlocked ? (
                          <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                        ) : (
                          <Lock className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {achievement.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {achievement.description}
                      </p>

                      {achievement.unlocked && achievement.unlockedAt && (
                        <p className="mt-2 text-[10px] text-slate-400">
                          Unlocked {formatDate(achievement.unlockedAt)}
                        </p>
                      )}

                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
                          <span>
                            {achievement.progress} / {achievement.target}
                          </span>
                          <span>{progressPct}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA] transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium",
                            achievement.unlocked
                              ? "bg-[#10B981]/10 text-[#10B981]"
                              : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {CATEGORY_LABELS[achievement.category]}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                          Target: {achievement.target}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

      {/* Detail Modal */}
      {selectedAchievement && (
        <DetailModal
          achievement={selectedAchievement}
          onClose={() => setSelectedAchievement(null)}
        />
      )}
    </div>
  );
}

export default function AchievementsPage() {
  return <AchievementsContent />;
}
