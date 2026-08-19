import { buildAnalyzer } from "@/lib/verification/base";
import type { QualityMetric } from "@/lib/verification/types";
import {
  clamp,
  completionTip,
  paceText,
  parsePaceSeconds,
  toNumber,
} from "@/lib/verification/helpers";

const distanceAnalyzer = buildAnalyzer({
  key: "distance",
  activityLabel: "Distance",
  readCompleted(ctx) {
    const p = ctx.proofData;
    const d = toNumber(p.distance);
    if (d > 0) {
      const unit = ctx.habit.goalUnit || "KM";
      return { value: d, label: `${d} ${unit}` };
    }
    const dur = toNumber(p.duration ?? p.matchDuration ?? p.workoutDuration);
    if (dur > 0) return { value: dur, label: `${dur} min` };
    return { value: 0, label: "—" };
  },
  activityQuality(ctx) {
    const p = ctx.proofData;
    const metrics: QualityMetric[] = [];
    const pace = parsePaceSeconds(p.averagePace);
    if (pace) {
      metrics.push({
        id: "pace",
        label: "Pace Quality",
        icon: "pace",
        score: clamp(Math.round(100 - Math.max(0, pace - 300) * 0.5), 20, 100),
        explanation: `${paceText(pace)}/km — ${
          pace <= 360 ? "fast & efficient" : pace <= 480 ? "steady & sustainable" : "recovery-level pace"
        }`,
      });
    }
    const calories = toNumber(p.calories);
    if (calories > 0) {
      metrics.push({
        id: "calories",
        label: "Calories Burned",
        icon: "calories",
        score: clamp(Math.round((calories / 400) * 100), 0, 100),
        explanation: `${calories} kcal reported for this session`,
      });
    }
    return metrics;
  },
  insight(ctx, analysis) {
    const pace = parsePaceSeconds(ctx.proofData.averagePace);
    if (pace) {
      const tip = pace <= 360 ? "excellent aerobic conditioning" : pace <= 480 ? "solid endurance base" : "a steady, sustainable rhythm";
      return `Held ${paceText(pace)}/km — ${tip}. ${completionTip(analysis)}`;
    }
    return completionTip(analysis);
  },
  extraChecklist(ctx) {
    const pace = parsePaceSeconds(ctx.proofData.averagePace);
    if (!pace) return [];
    return [{ label: "Pace Cross-Checked", detail: `${paceText(pace)}/km detected`, passed: true }];
  },
});

export { distanceAnalyzer };
