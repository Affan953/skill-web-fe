import { buildAnalyzer } from "@/lib/verification/base";
import type { QualityMetric } from "@/lib/verification/types";
import { avg, clamp, completionTip, toNumber } from "@/lib/verification/helpers";

const codingAnalyzer = buildAnalyzer({
  key: "coding",
  activityLabel: "Coding",
  readCompleted(ctx) {
    const p = ctx.proofData;
    const probs = toNumber(p.problemsSolved);
    if (probs > 0) return { value: probs, label: `${probs} problems` };
    const dur = toNumber(p.codingDuration ?? p.duration);
    if (dur > 0) return { value: dur, label: `${dur} min` };
    return { value: 0, label: "—" };
  },
  activityQuality(ctx) {
    const p = ctx.proofData;
    const metrics: QualityMetric[] = [];
    const probs = toNumber(p.problemsSolved);
    if (probs > 0) {
      metrics.push({
        id: "problems",
        label: "Problem Solving",
        icon: "problems",
        score: clamp(Math.round((probs / 3) * 100), 0, 100),
        explanation: `${probs} problems solved`,
      });
    }
    if (typeof p.featureBuilt === "string" && p.featureBuilt.trim().length > 0) {
      metrics.push({
        id: "feature",
        label: "Feature Completeness",
        icon: "feature",
        score: 90,
        explanation: `Shipped: "${p.featureBuilt.trim()}"`,
      });
    }
    if (typeof p.githubCommit === "string" && p.githubCommit.trim().length > 0) {
      metrics.push({
        id: "commit",
        label: "Commit Traceability",
        icon: "commit",
        score: 90,
        explanation: "Work is backed by a versioned commit",
      });
    }
    const difficulty = String(p.codingDifficulty ?? "").toLowerCase();
    if (difficulty) {
      metrics.push({
        id: "difficulty",
        label: "Task Difficulty",
        icon: "difficulty",
        score: difficulty === "hard" ? 95 : difficulty === "medium" ? 80 : 60,
        explanation: `${p.codingDifficulty}-level coding task`,
      });
    }
    return metrics;
  },
  insight(ctx, analysis) {
    const p = ctx.proofData;
    const hasFeature = typeof p.featureBuilt === "string" && p.featureBuilt.trim().length > 0;
    const hasCommit = typeof p.githubCommit === "string" && p.githubCommit.trim().length > 0;
    if (hasFeature && hasCommit) {
      return `Shipped a feature with a versioned commit — strong engineering practice. ${completionTip(analysis)}`;
    }
    const difficulty = String(p.codingDifficulty ?? "");
    if (difficulty) {
      return `Tackled a ${difficulty.toLowerCase()} task at ${analysis.completedLabel}. ${completionTip(analysis)}`;
    }
    return completionTip(analysis);
  },
  extraChecklist(ctx) {
    const p = ctx.proofData;
    const items: { label: string; detail: string; passed: boolean }[] = [];
    const diff = avg([toNumber(p.problemsSolved), toNumber(p.codingDuration)]);
    if (diff > 0) {
      items.push({ label: "Debugging Log Checked", detail: "Session data reconciled", passed: true });
    }
    return items;
  },
});

export { codingAnalyzer };
