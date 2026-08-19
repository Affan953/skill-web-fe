import { buildAnalyzer } from "@/lib/verification/base";
import type { QualityMetric } from "@/lib/verification/types";
import {
  clamp,
  completionTip,
  energyScore,
  hasValue,
  moodScore,
  toNumber,
} from "@/lib/verification/helpers";

const sportAnalyzer = buildAnalyzer({
  key: "sport",
  activityLabel: "Match & Training",
  readCompleted(ctx) {
    const p = ctx.proofData;
    const dur = toNumber(p.matchDuration ?? p.duration ?? p.workoutDuration);
    if (dur > 0) return { value: dur, label: `${dur} min` };
    const cal = toNumber(p.calories);
    if (cal > 0) return { value: cal, label: `${cal} kcal` };
    return { value: 0, label: "—" };
  },
  activityQuality(ctx) {
    const p = ctx.proofData;
    const metrics: QualityMetric[] = [];
    if (hasValue(p.energyLevel) || hasValue(p.moodAfter)) {
      metrics.push({
        id: "intensity",
        label: "Match Intensity",
        icon: "intensity",
        score: clamp(Math.round(energyScore(p.energyLevel) * 0.7 + moodScore(p.moodAfter) * 0.3), 0, 100),
        explanation: "Derived from reported energy and mood",
      });
    }
    const games = toNumber(p.gamesPlayed);
    if (games > 0) {
      metrics.push({
        id: "games",
        label: "Games Volume",
        icon: "games",
        score: clamp(Math.round((games / 3) * 100), 0, 100),
        explanation: `${games} games played this session`,
      });
    }
    const calories = toNumber(p.calories);
    if (calories > 0) {
      metrics.push({
        id: "calories",
        label: "Calories Burned",
        icon: "calories",
        score: clamp(Math.round((calories / 500) * 100), 0, 100),
        explanation: `${calories} kcal reported for this session`,
      });
    }
    return metrics;
  },
  insight(ctx, analysis) {
    const games = toNumber(ctx.proofData.gamesPlayed);
    if (games > 0) {
      return `Logged ${games} games at ${analysis.completedLabel}. ${completionTip(analysis)}`;
    }
    return completionTip(analysis);
  },
  extraChecklist(ctx) {
    if (!hasValue(ctx.proofData.moodAfter)) return [];
    return [{ label: "Recovery Checked", detail: "Post-match recovery noted", passed: true }];
  },
});

export { sportAnalyzer };
