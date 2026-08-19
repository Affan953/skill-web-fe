import type { AnalyzerResult, VerificationContext } from "@/lib/verification/types";
import { resolveAnalyzer } from "@/lib/verification/registry";

export interface MissionVerificationEngine {
  analyze(context: VerificationContext): AnalyzerResult;
}

export const missionVerificationEngine: MissionVerificationEngine = {
  analyze(context) {
    const analyzer = resolveAnalyzer(context.habit.activity);
    return analyzer.analyze(context);
  },
};
