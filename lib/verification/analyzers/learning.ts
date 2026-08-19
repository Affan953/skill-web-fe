import { buildAnalyzer } from "@/lib/verification/base";
import type { QualityMetric, VerificationContext } from "@/lib/verification/types";
import { clamp, completionTip, confidenceScore, hasValue, toNumber } from "@/lib/verification/helpers";

function practiceCount(ctx: VerificationContext): number {
  const p = ctx.proofData;
  return [p.speakingPractice, p.listeningPractice, p.readingPractice, p.writingPractice].filter((v) => hasValue(v)).length;
}

const learningAnalyzer = buildAnalyzer({
  key: "learning",
  activityLabel: "Learning",
  readCompleted(ctx) {
    const p = ctx.proofData;
    const dur = toNumber(p.studyDuration);
    if (dur > 0) return { value: dur, label: `${dur} min` };
    const probs = toNumber(p.problemsSolved);
    if (probs > 0) return { value: probs, label: `${probs} problems` };
    const vocab = toNumber(p.vocabularyCount ?? p.vocabularyLearned);
    if (vocab > 0) return { value: vocab, label: `${vocab} words` };
    return { value: 0, label: "—" };
  },
  activityQuality(ctx) {
    const p = ctx.proofData;
    const metrics: QualityMetric[] = [];
    const practices = practiceCount(ctx);
    if (practices > 0) {
      metrics.push({
        id: "diversity",
        label: "Practice Diversity",
        icon: "diversity",
        score: clamp(practices * 25, 0, 100),
        explanation: `${practices} of 4 skill areas practiced (speaking, listening, reading, writing)`,
      });
    }
    const vocab = toNumber(p.vocabularyCount ?? p.vocabularyLearned);
    if (vocab > 0) {
      metrics.push({
        id: "vocabulary",
        label: "Vocabulary Growth",
        icon: "vocabulary",
        score: clamp(Math.round((vocab / 10) * 100), 0, 100),
        explanation: `${vocab} new words learned`,
      });
    }
    const probs = toNumber(p.problemsSolved);
    if (probs > 0) {
      metrics.push({
        id: "problems",
        label: "Problem Solving",
        icon: "problems",
        score: clamp(Math.round((probs / 3) * 100), 0, 100),
        explanation: `${probs} problems worked through`,
      });
    }
    const confidence = p.confidence ?? p.confidenceLevel;
    if (hasValue(confidence)) {
      metrics.push({
        id: "confidence",
        label: "Confidence",
        icon: "confidence",
        score: confidenceScore(confidence),
        explanation: `Self-assessed confidence after this session`,
      });
    }
    return metrics;
  },
  insight(ctx, analysis) {
    const practices = practiceCount(ctx);
    const vocab = toNumber(ctx.proofData.vocabularyCount ?? ctx.proofData.vocabularyLearned);
    const parts: string[] = [];
    if (practices > 0) parts.push(`practiced ${practices} skill areas`);
    if (vocab > 0) parts.push(`added ${vocab} words`);
    const prefix = parts.length ? `${parts.join(" and ")} — ` : "";
    return `${prefix}${completionTip(analysis)}`;
  },
  extraChecklist(ctx) {
    const practices = practiceCount(ctx);
    if (practices < 2) return [];
    return [{ label: "Balanced Practice Verified", detail: `${practices} skill areas covered`, passed: true }];
  },
});

export { learningAnalyzer };
