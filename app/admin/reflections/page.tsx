"use client";

import { useState, useEffect } from "react";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { adminReflectionsApi } from "@/lib/api";
import type { AdminReflectionRow, ReflectionAnalytics } from "@/types";
import {
  Search,
  Loader2,
  AlertTriangle,
  BookOpen,
  Clock,
  Zap,
  Flame,
  Star,
  CheckCircle2,
  Target,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/cn";

const CATEGORY_COLORS: Record<string, string> = {
  Learning: "bg-[#2563EB]/10 text-[#2563EB]",
  Fitness: "bg-[#10B981]/10 text-[#10B981]",
  Reading: "bg-[#2563EB]/10 text-[#2563EB]",
  Meditation: "bg-[#10B981]/10 text-[#10B981]",
  Coding: "bg-[#2563EB]/10 text-[#2563EB]",
  Health: "bg-[#10B981]/10 text-[#10B981]",
  Productivity: "bg-[#2563EB]/10 text-[#2563EB]",
  Finance: "bg-[#10B981]/10 text-[#10B981]",
  Language: "bg-[#2563EB]/10 text-[#2563EB]",
  Custom: "bg-slate-100 text-slate-500",
};

export default function AdminReflectionsPage() {
  const { getToken, isAuthenticated } = useFirebaseToken();
  const [reflections, setReflections] = useState<AdminReflectionRow[]>([]);
  const [analytics, setAnalytics] = useState<ReflectionAnalytics | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReflections = async (q?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const [reflectionsData, analyticsData] = await Promise.all([
        adminReflectionsApi.getAll(token, q),
        adminReflectionsApi.getAnalytics(token),
      ]);
      setReflections(reflectionsData);
      setAnalytics(analyticsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load reflections");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) throw new Error("Not authenticated");
        const [reflectionsData, analyticsData] = await Promise.all([
          adminReflectionsApi.getAll(token),
          adminReflectionsApi.getAnalytics(token),
        ]);
        if (!cancelled) {
          setReflections(reflectionsData);
          setAnalytics(analyticsData);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load reflections");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, getToken]);

  const handleSearch = () => {
    fetchReflections(search || undefined);
  };

  const filtered = reflections;

  return (
    <div>
      <section className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reflections</h1>
            <p className="mt-1 text-sm text-slate-500">
              View all user reflections and platform analytics
            </p>
          </div>
        </div>
      </section>

      {/* Analytics Summary */}
      {analytics && (
        <section className="mb-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Platform Analytics
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB]/10">
                  <BookOpen className="h-5 w-5 text-[#2563EB]" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Total Reflections</p>
                  <p className="text-lg font-bold text-slate-900">{analytics.totalReflections}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#10B981]/10">
                  <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Proof Submitted</p>
                  <p className="text-lg font-bold text-slate-900">{analytics.completionRate}%</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#8B5CF6]/10">
                  <Timer className="h-5 w-5 text-[#8B5CF6]" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Avg. Session</p>
                  <p className="text-lg font-bold text-slate-900">{analytics.averageSessionDuration} min</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                  <Target className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Avg. Length</p>
                  <p className="text-lg font-bold text-slate-900">{analytics.averageReflectionLength} chars</p>
                </div>
              </div>
            </div>
          </div>

          {analytics.mostActiveCategories.length > 0 && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-2 text-xs font-medium text-slate-500">Most Active Categories</p>
              <div className="flex flex-wrap gap-2">
                {analytics.mostActiveCategories.slice(0, 5).map((cat) => (
                  <span
                    key={cat.category}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      CATEGORY_COLORS[cat.category] ?? "bg-slate-100 text-slate-500"
                    )}
                  >
                    {cat.category}: {cat.count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search reflections..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
          >
            Search
          </button>
        </div>
      </section>

      <section>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-white py-16 text-center">
            <AlertTriangle className="mb-3 h-6 w-6 text-red-400" />
            <p className="text-sm font-medium text-red-400">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-center">
            <BookOpen className="mb-3 h-6 w-6 text-slate-400" />
            <p className="text-sm font-medium text-slate-500">
              No reflections found
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB]/10">
                      <BookOpen className="h-5 w-5 text-[#2563EB]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        {r.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">
                          by {r.ownerName}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium",
                            CATEGORY_COLORS[r.category] ?? "bg-slate-100 text-slate-500"
                          )}
                        >
                          {r.category}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          {new Date(r.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="flex items-center gap-1 text-xs font-semibold text-[#10B981]">
                      <Zap className="h-3 w-3" />+{r.xpEarned} XP
                    </span>
                  </div>
                </div>

                <p className="mb-3 text-sm text-slate-600 leading-relaxed">
                  {r.reflection}
                </p>

                {r.proofOfProgress && Object.keys(r.proofOfProgress).length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {Object.entries(r.proofOfProgress).map(([key, value]) => (
                      <span
                        key={key}
                        className="rounded-full bg-[#10B981]/10 px-2.5 py-1 text-[11px] font-medium text-[#10B981]"
                      >
                        {key}: {typeof value === "object" ? JSON.stringify(value) : String(value)}
                      </span>
                    ))}
                  </div>
                )}

                {r.metrics && Object.keys(r.metrics).length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {Object.entries(r.metrics).map(([key, value]) => (
                      <span
                        key={key}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-500"
                      >
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 border-t border-slate-100 pt-3">
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Flame className="h-3 w-3" />
                    Streak: {r.streakAfter}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Star className="h-3 w-3" />
                    Level: {r.levelAfter}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
