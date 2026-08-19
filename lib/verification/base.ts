import type {
  ActivityAnalyzer,
  AnalyzerResult,
  ChecklistItem,
  MissionAnalysis,
  QualityMetric,
  VerificationContext,
} from "@/lib/verification/types";
import {
  avg,
  clamp,
  completionPercent,
  confidenceScore,
  energyScore,
  hasValue,
  moodScore,
  scoreToRank,
  statusFromScore,
} from "@/lib/verification/helpers";
import { formatGoal } from "@/lib/habitGoal";

const UNIVERSAL_IDS = ["mission", "proof", "reflection", "consistency", "accuracy"];

export interface CompletedValue {
  value: number;
  label: string;
}

export interface AnalyzerParts {
  key: string;
  activityLabel: string;
  readCompleted(ctx: VerificationContext): CompletedValue;
  activityQuality(ctx: VerificationContext): QualityMetric[];
  insight(ctx: VerificationContext, analysis: MissionAnalysis): string;
  extraChecklist?(ctx: VerificationContext, analysis: MissionAnalysis): ChecklistItem[];
}

function scoreExplanation(score: number, high: string, mid: string, low: string): string {
  if (score >= 75) return high;
  if (score >= 50) return mid;
  return low;
}

function countCustomMetrics(ctx: VerificationContext): number {
  const custom = ctx.proofData.customMetrics;
  if (!Array.isArray(custom)) return 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return custom.filter((m: any) => hasValue(m.value)).length;
}

function filledProofCount(ctx: VerificationContext): number {
  const entries = Object.entries(ctx.proofData).filter(([, v]) => hasValue(v)).length;
  const custom = countCustomMetrics(ctx);
  return entries + Math.max(0, custom - 1);
}

function proofCompletenessScore(ctx: VerificationContext): number {
  return clamp(20 + filledProofCount(ctx) * 13, 0, 100);
}

function reflectionQualityScore(ctx: VerificationContext): number {
  const reflection = (ctx.reflection ?? "").trim();
  if (reflection.length >= 120) return 90;
  if (reflection.length >= 60) return 80;
  if (reflection.length >= 30) return 68;
  if (reflection.length >= 10) return 55;
  const signals = [ctx.proofData.lessonLearned, ctx.proofData.biggestLesson, ctx.proofData.favoriteQuote];
  const filled = signals.filter((s) => typeof s === "string" && s.trim().length > 0).length;
  return clamp(35 + filled * 18, 0, 80);
}

function consistencyScoreFn(ctx: VerificationContext): number {
  const energy = energyScore(ctx.proofData.energyLevel ?? ctx.proofData.energy);
  const confidence = confidenceScore(ctx.proofData.confidence ?? ctx.proofData.confidenceLevel);
  const mood = moodScore(ctx.proofData.moodAfter ?? ctx.proofData.moodBefore);
  const dur = ctx.durationMinutes > 0 ? clamp(Math.round((ctx.durationMinutes / 45) * 100), 30, 100) : 60;
  return clamp(Math.round(energy * 0.35 + confidence * 0.25 + mood * 0.2 + dur * 0.2), 0, 100);
}

function missionExplanation(a: MissionAnalysis): string {
  if (a.completionPercent >= 100) return `Goal met or exceeded (${a.completionPercent}% of target)`;
  if (a.completionPercent >= 80) return `Close to target — ${100 - a.completionPercent}% away`;
  if (a.completionPercent >= 50) return `Partially reached — keep pushing toward ${a.goalValue}`;
  return `Target not reached this session (${a.completionPercent}%)`;
}

function accuracyExplanation(percent: number): string {
  if (percent >= 100) {
    return percent === 100 ? "Declared value matches the target exactly" : `Completed ${percent}% of target — exceeds goal`;
  }
  return `${100 - percent}% short of the declared target`;
}

export function analyzeGoal(ctx: VerificationContext, completed: CompletedValue): MissionAnalysis {
  const goal = formatGoal(ctx.habit);
  const target = ctx.habit.goalValue ?? 0;
  const percent = completionPercent(completed.value, target);
  const status =
    percent >= 100 ? "Excellent" : percent >= 80 ? "On Track" : percent >= 50 ? "Behind" : "Incomplete";
  return {
    goalLabel: goal.label,
    goalValue: goal.value || "—",
    completedLabel: completed.label || "—",
    completedValue: completed.value,
    completionPercent: percent,
    status,
  };
}

export function universalQuality(ctx: VerificationContext, analysis: MissionAnalysis): QualityMetric[] {
  const missionScore = clamp(analysis.completionPercent, 0, 100);
  const proofScore = proofCompletenessScore(ctx);
  const reflectionScore = reflectionQualityScore(ctx);
  const consistencyScore = consistencyScoreFn(ctx);
  const accuracyScore = clamp(100 - Math.abs(analysis.completionPercent - 100), 0, 100);
  return [
    { id: "mission", label: "Mission Quality", icon: "mission", score: missionScore, explanation: missionExplanation(analysis) },
    { id: "proof", label: "Proof Quality", icon: "proof", score: proofScore, explanation: scoreExplanation(proofScore, "Detailed, verifiable proof provided", "Basic proof provided", "Limited proof data") },
    { id: "reflection", label: "Reflection Quality", icon: "reflection", score: reflectionScore, explanation: scoreExplanation(reflectionScore, "Deep, thoughtful reflection captured", "Some reflection captured", "Minimal reflection data") },
    { id: "consistency", label: "Consistency", icon: "consistency", score: consistencyScore, explanation: scoreExplanation(consistencyScore, "Signals align — highly consistent session", "Moderately consistent session", "Signals conflict across the session") },
    { id: "accuracy", label: "Completion Accuracy", icon: "accuracy", score: accuracyScore, explanation: accuracyExplanation(analysis.completionPercent) },
  ];
}

export function computeScore(quality: QualityMetric[]): number {
  const universal = quality.filter((q) => UNIVERSAL_IDS.includes(q.id)).map((q) => q.score);
  const activity = quality.filter((q) => !UNIVERSAL_IDS.includes(q.id)).map((q) => q.score);
  const universalAvg = avg(universal);
  const activityAvg = activity.length ? avg(activity) : 50;
  return clamp(Math.round(universalAvg * 0.85 + activityAvg * 0.15), 0, 100);
}

export function commonChecklist(ctx: VerificationContext, analysis: MissionAnalysis, score: number): ChecklistItem[] {
  const hasGoal = ctx.habit.goalValue != null || ctx.habit.goalLabel != null || ctx.habit.activity != null;
  const dataPoints = filledProofCount(ctx);
  return [
    { label: "Mission Goal Loaded", detail: hasGoal ? `${analysis.goalLabel} · ${analysis.goalValue}` : "Fallback baseline applied", passed: hasGoal },
    { label: "Proof Report Received", detail: `${dataPoints} data points submitted`, passed: dataPoints > 0 },
    { label: "Performance Analyzed", detail: `Completion at ${analysis.completionPercent}%`, passed: analysis.completedValue > 0 },
    { label: "Quality Scored", detail: `${analysis.goalLabel} cross-validated across 5 dimensions`, passed: true },
    { label: "Insight Generated", detail: "Personalized recommendation ready", passed: true },
    { label: "Reward Eligibility Confirmed", detail: score >= 40 ? "Rewards unlocked for this mission" : "Below reward threshold", passed: score >= 40 },
  ];
}

export function buildAnalyzer(parts: AnalyzerParts): ActivityAnalyzer {
  return {
    key: parts.key,
    activityLabel: parts.activityLabel,
    analyze(ctx: VerificationContext): AnalyzerResult {
      const completed = parts.readCompleted(ctx);
      const analysis = analyzeGoal(ctx, completed);
      const quality = [...universalQuality(ctx, analysis), ...parts.activityQuality(ctx)];
      const score = computeScore(quality);
      const checklist = [...commonChecklist(ctx, analysis, score), ...(parts.extraChecklist?.(ctx, analysis) ?? [])];
      return {
        analysis,
        quality,
        checklist,
        score,
        rank: scoreToRank(score),
        status: statusFromScore(score),
        insight: parts.insight(ctx, analysis),
      };
    },
  };
}
