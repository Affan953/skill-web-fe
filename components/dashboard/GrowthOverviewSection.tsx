"use client";

import {
  TrendingUp,
  TrendingDown,
  Target,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { useGrowthOverview } from "@/hooks/usePayments";
import PremiumGate from "@/components/PremiumGate";
import { cn } from "@/lib/cn";

/**
 * Premium-only "Growth Overview" block rendered on the dashboard.
 * For FREE users the PremiumGate shows a subtle preview + upgrade CTA.
 * For PREMIUM users the data comes from the real, backend-gated endpoint.
 */
export default function GrowthOverviewSection() {
  return (
    <PremiumGate
      title="Understand your growth"
      description="Unlock deeper analytics with a personal growth overview."
      className="mb-8"
    >
      <GrowthOverviewContent />
    </PremiumGate>
  );
}

function GrowthOverviewContent() {
  const { data, isLoading } = useGrowthOverview();

  return (
    <section className="mb-8">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Growth Overview
      </h3>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-slate-100 bg-slate-50"
            />
          ))}
        </div>
      ) : !data ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-[#64748B]">
          Your growth overview will appear here.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            icon={Target}
            label="Consistency"
            value={`${data.consistency}%`}
            trend={data.trend}
          />
          <Metric
            icon={CheckCircle2}
            label="Habits completed"
            value={`${data.habitsCompleted} / ${data.totalHabits}`}
          />
          <Metric
            icon={Flame}
            label="Current streak"
            value={`${data.currentStreak} days`}
          />
          <Metric
            icon={data.trend === "declining" ? TrendingDown : TrendingUp}
            label="Growth trend"
            value={data.trend ? labelTrend(data.trend) : "Building"}
            trend={data.trend}
          />
        </div>
      )}

      {data?.insight && (
        <div className="mt-4 rounded-xl border border-[#2563EB]/10 bg-[#2563EB]/[0.03] px-5 py-4 text-sm text-[#0F172A]">
          {data.insight}
        </div>
      )}
    </section>
  );
}

function labelTrend(t: "improving" | "declining" | "steady"): string {
  if (t === "improving") return "↑ Improving";
  if (t === "declining") return "↓ Refocus";
  return "Steady";
}

function Metric({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  trend?: "improving" | "declining" | "steady" | null;
}) {
  const positive =
    trend === "improving" || (!trend && label !== "Growth trend");
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <Icon
          className={cn(
            "h-4 w-4",
            trend === "declining"
              ? "text-red-400"
              : positive
                ? "text-[#10B981]"
                : "text-[#94A3B8]"
          )}
        />
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
        {value}
      </p>
    </div>
  );
}