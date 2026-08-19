import { buildAnalyzer } from "@/lib/verification/base";
import type { QualityMetric } from "@/lib/verification/types";
import { clamp, completionTip, hasValue, toNumber } from "@/lib/verification/helpers";

const readingAnalyzer = buildAnalyzer({
  key: "reading",
  activityLabel: "Reading",
  readCompleted(ctx) {
    const p = ctx.proofData;
    const pages = toNumber(p.pagesRead);
    if (pages > 0) return { value: pages, label: `${pages} pages` };
    const dur = toNumber(p.readingDuration ?? p.duration);
    if (dur > 0) return { value: dur, label: `${dur} min` };
    return { value: 0, label: "—" };
  },
  activityQuality(ctx) {
    const p = ctx.proofData;
    const metrics: QualityMetric[] = [];
    const pages = toNumber(p.pagesRead);
    const dur = toNumber(p.readingDuration);
    if (pages > 0 && dur > 0) {
      const per30 = (pages / Math.max(1, dur)) * 30;
      metrics.push({
        id: "pace",
        label: "Reading Pace",
        icon: "pace",
        score: clamp(Math.round((per30 / 30) * 100), 20, 100),
        explanation: `≈${per30.toFixed(1)} pages per 30 minutes`,
      });
    }
    const depthFields = [p.favoriteQuote, p.biggestLesson, p.chapter, p.book, p.bookTitle];
    const filled = depthFields.filter((f) => typeof f === "string" && f.trim().length > 0).length;
    if (filled > 0) {
      metrics.push({
        id: "depth",
        label: "Comprehension Depth",
        icon: "depth",
        score: clamp(30 + filled * 18, 0, 100),
        explanation: `${filled} reflection signal${filled > 1 ? "s" : ""} (quote, lesson, chapter) captured`,
      });
    }
    return metrics;
  },
  insight(ctx, analysis) {
    const p = ctx.proofData;
    const pages = toNumber(p.pagesRead);
    const dur = toNumber(p.readingDuration);
    if (pages > 0 && dur > 0) {
      const per30 = (pages / Math.max(1, dur)) * 30;
      return `Read at ≈${per30.toFixed(1)} pages per half hour. ${completionTip(analysis)}`;
    }
    if (hasValue(p.biggestLesson)) {
      return `A clear takeaway was recorded this session. ${completionTip(analysis)}`;
    }
    return completionTip(analysis);
  },
});

export { readingAnalyzer };
