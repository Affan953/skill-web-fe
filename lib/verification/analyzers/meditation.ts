import { buildAnalyzer } from "@/lib/verification/base";
import type { QualityMetric } from "@/lib/verification/types";
import { clamp, completionTip, hasValue, moodScore, toNumber } from "@/lib/verification/helpers";

const meditationAnalyzer = buildAnalyzer({
  key: "meditation",
  activityLabel: "Meditation",
  readCompleted(ctx) {
    const dur = toNumber(ctx.proofData.meditationDuration);
    if (dur > 0) return { value: dur, label: `${dur} min` };
    return { value: 0, label: "—" };
  },
  activityQuality(ctx) {
    const p = ctx.proofData;
    const metrics: QualityMetric[] = [];
    const before = String(p.moodBefore ?? "");
    const after = String(p.moodAfter ?? "");
    if (before && after) {
      const shift = moodScore(after) - moodScore(before);
      metrics.push({
        id: "calm",
        label: "Calm Shift",
        icon: "calm",
        score: clamp(Math.round(60 + shift), 0, 100),
        explanation: shift > 0 ? `Mood improved from "${before}" to "${after}"` : shift === 0 ? "Mood held steady through the session" : "Mood dipped slightly this session",
      });
    }
    const stress = toNumber(p.stressLevel);
    if (stress > 0) {
      metrics.push({
        id: "stress",
        label: "Stress Relief",
        icon: "stress",
        score: clamp(Math.round(stress * 10), 10, 100),
        explanation: `Reported ${stress}/10 on the low-stress scale`,
      });
    }
    const dur = toNumber(p.meditationDuration);
    if (dur > 0) {
      const score = dur >= 20 ? 100 : dur >= 10 ? 75 : dur >= 5 ? 50 : 30;
      metrics.push({
        id: "depth",
        label: "Session Depth",
        icon: "depth",
        score,
        explanation: `${dur}-minute mindful session`,
      });
    }
    return metrics;
  },
  insight(ctx, analysis) {
    const before = String(ctx.proofData.moodBefore ?? "");
    const after = String(ctx.proofData.moodAfter ?? "");
    if (before && after && moodScore(after) > moodScore(before)) {
      return `Mood shifted from "${before}" to "${after}" — a clear mindfulness payoff. ${completionTip(analysis)}`;
    }
    return completionTip(analysis);
  },
  extraChecklist(ctx) {
    if (!hasValue(ctx.proofData.moodAfter)) return [];
    return [{ label: "Post-Session State Logged", detail: "Mood & stress recorded", passed: true }];
  },
});

export { meditationAnalyzer };
