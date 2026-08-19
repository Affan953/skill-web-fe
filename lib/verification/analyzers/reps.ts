import { buildAnalyzer } from "@/lib/verification/base";
import type { QualityMetric } from "@/lib/verification/types";
import { clamp, completionTip, toNumber } from "@/lib/verification/helpers";

const repsAnalyzer = buildAnalyzer({
  key: "reps",
  activityLabel: "Repetitions",
  readCompleted(ctx) {
    const p = ctx.proofData;
    const reps = toNumber(p.completedReps ?? p.reps);
    if (reps > 0) return { value: reps, label: `${reps} reps` };
    return { value: 0, label: "—" };
  },
  activityQuality(ctx) {
    const p = ctx.proofData;
    const metrics: QualityMetric[] = [];
    const best = toNumber(p.bestSet);
    if (best > 0) {
      const target = ctx.habit.goalValue || 30;
      metrics.push({
        id: "peak",
        label: "Peak Set Performance",
        icon: "peak",
        score: clamp(Math.round((best / Math.max(1, target / 3)) * 100), 20, 100),
        explanation: `Best single set of ${best} reps against target volume`,
      });
    }
    const difficulty = String(p.exerciseDifficulty ?? "").toLowerCase();
    if (difficulty) {
      const score = difficulty === "hard" ? 95 : difficulty === "medium" ? 80 : 60;
      metrics.push({
        id: "difficulty",
        label: "Exercise Difficulty",
        icon: "difficulty",
        score,
        explanation: `${p.exerciseDifficulty} intensity workout`,
      });
    }
    return metrics;
  },
  insight(ctx, analysis) {
    const best = toNumber(ctx.proofData.bestSet);
    const target = ctx.habit.goalValue || 0;
    if (best > 0 && target > 0) {
      return `Best set of ${best} reps on a ${target}-rep target. ${completionTip(analysis)}`;
    }
    return completionTip(analysis);
  },
});

export { repsAnalyzer };
