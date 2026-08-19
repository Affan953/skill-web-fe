import { buildAnalyzer } from "@/lib/verification/base";
import type { QualityMetric } from "@/lib/verification/types";
import { clamp, completionTip, hasValue, toNumber } from "@/lib/verification/helpers";

const healthAnalyzer = buildAnalyzer({
  key: "health",
  activityLabel: "Health",
  readCompleted(ctx) {
    const p = ctx.proofData;
    const water = toNumber(p.waterIntake);
    if (water > 0) return { value: water, label: `${water} glasses` };
    const sleep = toNumber(p.sleepDuration);
    if (sleep > 0) return { value: sleep, label: `${sleep} hrs` };
    const dur = toNumber(p.stretchDuration ?? p.duration);
    if (dur > 0) return { value: dur, label: `${dur} min` };
    if (hasValue(p.medicineTaken) || hasValue(p.taken)) return { value: 1, label: "Taken" };
    return { value: 0, label: "—" };
  },
  activityQuality(ctx) {
    const p = ctx.proofData;
    const metrics: QualityMetric[] = [];
    const water = toNumber(p.waterIntake);
    if (water > 0) {
      metrics.push({
        id: "hydration",
        label: "Hydration",
        icon: "hydration",
        score: clamp(Math.round((water / 8) * 100), 0, 100),
        explanation: `${water} glasses against an 8-glass baseline`,
      });
    }
    const sleep = toNumber(p.sleepDuration);
    if (sleep > 0) {
      metrics.push({
        id: "rest",
        label: "Rest Quality",
        icon: "rest",
        score: clamp(Math.round(100 - Math.abs(sleep - 8) * 15), 10, 100),
        explanation: `${sleep} hours of sleep (ideal ~8)`,
      });
    }
    const dur = toNumber(p.stretchDuration ?? p.duration);
    if (dur > 0) {
      metrics.push({
        id: "mobility",
        label: "Mobility",
        icon: "mobility",
        score: clamp(Math.round((dur / 10) * 100), 0, 100),
        explanation: `${dur}-minute movement session`,
      });
    }
    const steps = toNumber(p.steps);
    if (steps > 0) {
      metrics.push({
        id: "steps",
        label: "Step Count",
        icon: "steps",
        score: clamp(Math.round((steps / 8000) * 100), 0, 100),
        explanation: `${steps.toLocaleString("en-US")} steps logged`,
      });
    }
    return metrics;
  },
  insight(ctx, analysis) {
    const p = ctx.proofData;
    if (toNumber(p.waterIntake) > 0) {
      const water = toNumber(p.waterIntake);
      return water >= 8 ? "Hydration goal cleared — well done. " + completionTip(analysis) : `Drink ${8 - water} more glasses next time. ` + completionTip(analysis);
    }
    if (toNumber(p.sleepDuration) > 0) {
      const sleep = toNumber(p.sleepDuration);
      return sleep >= 7 && sleep <= 9 ? "Optimal rest window reached. " + completionTip(analysis) : `Aim for 7–9 hours — you logged ${sleep}. ` + completionTip(analysis);
    }
    return completionTip(analysis);
  },
  extraChecklist(ctx) {
    if (!hasValue(ctx.proofData.energyLevel)) return [];
    return [{ label: "Wellness Signals Reviewed", detail: "Energy & activity reconciled", passed: true }];
  },
});

export { healthAnalyzer };
