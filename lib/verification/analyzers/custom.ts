import { buildAnalyzer } from "@/lib/verification/base";
import type { QualityMetric, VerificationContext } from "@/lib/verification/types";
import { clamp, completionTip, energyScore, hasValue, toNumber } from "@/lib/verification/helpers";

interface CustomMetricRow {
  name: string;
  value: string;
  unit: string;
}

function customMetrics(ctx: VerificationContext): CustomMetricRow[] {
  const list = ctx.proofData.customMetrics;
  return Array.isArray(list) ? list : [];
}

const FALLBACK_FIELDS: { key: string; suffix: (n: number, ctx: VerificationContext) => string }[] = [
  { key: "duration", suffix: (n) => `${n} min` },
  { key: "distance", suffix: (n, ctx) => `${n} ${ctx.habit.goalUnit || "KM"}` },
  { key: "reps", suffix: (n) => `${n} reps` },
  { key: "pagesRead", suffix: (n) => `${n} pages` },
  { key: "studyDuration", suffix: (n) => `${n} min` },
  { key: "tasksFinished", suffix: (n) => `${n} tasks` },
];

const customAnalyzer = buildAnalyzer({
  key: "custom",
  activityLabel: "Custom Mission",
  readCompleted(ctx) {
    const p = ctx.proofData;
    const filled = customMetrics(ctx).filter((m) => toNumber(m.value) > 0);
    if (filled.length > 0) {
      const first = filled[0];
      return { value: toNumber(first.value), label: first.unit ? `${first.value} ${first.unit}` : String(first.value) };
    }
    for (const field of FALLBACK_FIELDS) {
      const n = toNumber(p[field.key]);
      if (n > 0) return { value: n, label: field.suffix(n, ctx) };
    }
    return { value: 0, label: "—" };
  },
  activityQuality(ctx) {
    const p = ctx.proofData;
    const metrics: QualityMetric[] = [];
    const filled = customMetrics(ctx).filter((m) => hasValue(m.name) && hasValue(m.value));
    if (filled.length > 0) {
      metrics.push({
        id: "metrics",
        label: "Custom Metrics Depth",
        icon: "metrics",
        score: clamp(filled.length * 33, 0, 100),
        explanation: `${filled.length} custom metric${filled.length > 1 ? "s" : ""} defined and reported`,
      });
    }
    if (hasValue(p.energyLevel)) {
      metrics.push({
        id: "commitment",
        label: "Session Commitment",
        icon: "commitment",
        score: energyScore(p.energyLevel),
        explanation: `Reported energy level: ${p.energyLevel}`,
      });
    }
    return metrics;
  },
  insight(ctx, analysis) {
    const filled = customMetrics(ctx).filter((m) => hasValue(m.name) && hasValue(m.value));
    if (filled.length > 0) {
      return `Tracked ${filled.length} custom metric${filled.length > 1 ? "s" : ""} for this mission. ${completionTip(analysis)}`;
    }
    return completionTip(analysis);
  },
  extraChecklist(ctx) {
    const filled = customMetrics(ctx).filter((m) => hasValue(m.name) && hasValue(m.value));
    if (filled.length === 0) return [];
    return [{ label: "Custom Metrics Validated", detail: `${filled.length} metrics accepted`, passed: true }];
  },
});

export { customAnalyzer };
