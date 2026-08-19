import { buildAnalyzer } from "@/lib/verification/base";
import type { QualityMetric } from "@/lib/verification/types";
import { clamp, completionTip, toNumber } from "@/lib/verification/helpers";

const productivityAnalyzer = buildAnalyzer({
  key: "productivity",
  activityLabel: "Productivity",
  readCompleted(ctx) {
    const p = ctx.proofData;
    const tasks = toNumber(p.tasksFinished);
    if (tasks > 0) return { value: tasks, label: `${tasks} tasks` };
    const dur = toNumber(p.deepWorkDuration ?? p.duration);
    if (dur > 0) return { value: dur, label: `${dur} min` };
    return { value: 0, label: "—" };
  },
  activityQuality(ctx) {
    const p = ctx.proofData;
    const metrics: QualityMetric[] = [];
    const focus = toNumber(p.focusScore);
    if (focus > 0) {
      metrics.push({
        id: "focus",
        label: "Deep Focus",
        icon: "focus",
        score: clamp(Math.round((focus / 10) * 100), 0, 100),
        explanation: `Self-rated focus of ${focus}/10`,
      });
    }
    const tasks = toNumber(p.tasksFinished);
    if (tasks > 0) {
      metrics.push({
        id: "output",
        label: "Output Volume",
        icon: "output",
        score: clamp(Math.round((tasks / 5) * 100), 0, 100),
        explanation: `${tasks} tasks finished this session`,
      });
    }
    const dur = toNumber(p.deepWorkDuration);
    if (dur > 0) {
      metrics.push({
        id: "depth",
        label: "Focus Duration",
        icon: "depth",
        score: clamp(Math.round((dur / 60) * 100), 0, 100),
        explanation: `${dur} minutes of deep work`,
      });
    }
    if (typeof p.interruptions === "number") {
      metrics.push({
        id: "interruptions",
        label: "Interruption Control",
        icon: "interruptions",
        score: clamp(Math.round(100 - p.interruptions * 20), 0, 100),
        explanation: `${p.interruptions} interruption${p.interruptions === 1 ? "" : "s"} during focus`,
      });
    }
    return metrics;
  },
  insight(ctx, analysis) {
    const p = ctx.proofData;
    if (typeof p.interruptions === "number") {
      return `Managed ${p.interruptions} interruption${p.interruptions === 1 ? "" : "s"} during ${analysis.completedLabel}. ${completionTip(analysis)}`;
    }
    return completionTip(analysis);
  },
  extraChecklist(ctx) {
    if (typeof ctx.proofData.interruptions !== "number") return [];
    return [{ label: "Focus Session Logged", detail: "Interruptions tracked", passed: true }];
  },
});

export { productivityAnalyzer };
