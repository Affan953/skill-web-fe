import type { Habit } from "@/types";

export type VerificationPhase =
  | "idle"
  | "scanning"
  | "analyzing"
  | "comparing"
  | "result";

export type Rank = "S+" | "S" | "A" | "B" | "C";

export interface RankInfo {
  grade: Rank;
  label: string;
  color: string;
  bg: string;
  score: number;
}

export interface QualityMetric {
  id: string;
  label: string;
  icon: string;
  score: number;
  explanation: string;
}

export interface MissionAnalysis {
  goalLabel: string;
  goalValue: string;
  completedLabel: string;
  completedValue: number;
  completionPercent: number;
  status: "Excellent" | "On Track" | "Behind" | "Incomplete";
}

export interface ChecklistItem {
  label: string;
  detail: string;
  passed: boolean;
}

export interface AnalyzerResult {
  analysis: MissionAnalysis;
  quality: QualityMetric[];
  checklist: ChecklistItem[];
  score: number;
  rank: Rank;
  status: string;
  insight: string;
}

export interface VerificationContext {
  habit: Habit;
  durationMinutes: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proofData: Record<string, any>;
  reflection?: string;
}

export interface ActivityAnalyzer {
  key: string;
  activityLabel: string;
  analyze(context: VerificationContext): AnalyzerResult;
}
