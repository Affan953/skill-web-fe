import type { ActivityAnalyzer } from "@/lib/verification/types";
import { distanceAnalyzer } from "@/lib/verification/analyzers/distance";
import { sportAnalyzer } from "@/lib/verification/analyzers/sport";
import { repsAnalyzer } from "@/lib/verification/analyzers/reps";
import { readingAnalyzer } from "@/lib/verification/analyzers/reading";
import { learningAnalyzer } from "@/lib/verification/analyzers/learning";
import { codingAnalyzer } from "@/lib/verification/analyzers/coding";
import { financeAnalyzer } from "@/lib/verification/analyzers/finance";
import { meditationAnalyzer } from "@/lib/verification/analyzers/meditation";
import { healthAnalyzer } from "@/lib/verification/analyzers/health";
import { productivityAnalyzer } from "@/lib/verification/analyzers/productivity";
import { customAnalyzer } from "@/lib/verification/analyzers/custom";

// Activity Analyzer Registry — one analyzer per activity key.
// Adding a new activity requires only (1) an analyzer and (2) one line here.
const activityAnalyzers: Record<string, ActivityAnalyzer> = {
  running: distanceAnalyzer,
  walking: distanceAnalyzer,
  jogging: distanceAnalyzer,
  cycling: distanceAnalyzer,
  swimming: distanceAnalyzer,
  "morning walk": distanceAnalyzer,
  badminton: sportAnalyzer,
  football: sportAnalyzer,
  basketball: sportAnalyzer,
  "gym workout": sportAnalyzer,
  yoga: sportAnalyzer,
  stretching: sportAnalyzer,
  "push up": repsAnalyzer,
  "pull up": repsAnalyzer,
  book: readingAnalyzer,
  novel: readingAnalyzer,
  documentation: readingAnalyzer,
  "research paper": readingAnalyzer,
  article: readingAnalyzer,
  english: learningAnalyzer,
  japanese: learningAnalyzer,
  mathematics: learningAnalyzer,
  research: learningAnalyzer,
  "programming course": learningAnalyzer,
  "build feature": codingAnalyzer,
  "fix bug": codingAnalyzer,
  leetcode: codingAnalyzer,
  "code review": codingAnalyzer,
  refactoring: codingAnalyzer,
  "save money": financeAnalyzer,
  "track expenses": financeAnalyzer,
  "budget planning": financeAnalyzer,
  investing: financeAnalyzer,
  mindfulness: meditationAnalyzer,
  "breathing exercise": meditationAnalyzer,
  "focus session": meditationAnalyzer,
  "drink water": healthAnalyzer,
  sleep: healthAnalyzer,
  medicine: healthAnalyzer,
  stretch: healthAnalyzer,
  "deep work": productivityAnalyzer,
  "task management": productivityAnalyzer,
  "email cleanup": productivityAnalyzer,
  planning: productivityAnalyzer,
  custom: customAnalyzer,
};

export function resolveAnalyzer(activity: string | null | undefined): ActivityAnalyzer {
  if (activity) {
    const key = activity.trim().toLowerCase();
    if (activityAnalyzers[key]) return activityAnalyzers[key];
  }
  return customAnalyzer;
}
