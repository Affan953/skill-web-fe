import { buildAnalyzer } from "@/lib/verification/base";
import type { QualityMetric } from "@/lib/verification/types";
import { clamp, completionTip, toNumber } from "@/lib/verification/helpers";
import { formatGoalValue, resolveGoalKind } from "@/lib/habitGoal";

const financeAnalyzer = buildAnalyzer({
  key: "finance",
  activityLabel: "Finance",
  readCompleted(ctx) {
    const p = ctx.proofData;
    const money = toNumber(p.moneySaved);
    const kind = resolveGoalKind(ctx.habit);
    if (kind === "money" && money > 0) {
      return { value: money, label: formatGoalValue(money, ctx.habit.goalUnit) };
    }
    const entries = toNumber(p.entriesLogged ?? p.transactionsLogged);
    if (kind === "counter" && entries > 0) return { value: entries, label: `${entries} entries` };
    if (money > 0) return { value: money, label: formatGoalValue(money, ctx.habit.goalUnit) };
    return { value: 0, label: "—" };
  },
  activityQuality(ctx) {
    const p = ctx.proofData;
    const metrics: QualityMetric[] = [];
    const money = toNumber(p.moneySaved);
    if (money > 0) {
      const goal = ctx.habit.goalValue || 0;
      const score = goal > 0 ? clamp(Math.round((money / goal) * 100), 0, 100) : 80;
      metrics.push({
        id: "savings",
        label: "Savings Discipline",
        icon: "savings",
        score,
        explanation: goal > 0 ? `${formatGoalValue(money, ctx.habit.goalUnit)} toward ${formatGoalValue(goal, ctx.habit.goalUnit)} goal` : `${formatGoalValue(money, ctx.habit.goalUnit)} saved`,
      });
    }
    if (typeof p.expenseAvoided === "string" && p.expenseAvoided.trim().length > 0) {
      metrics.push({
        id: "expense",
        label: "Expense Awareness",
        icon: "expense",
        score: 90,
        explanation: `Avoided: ${p.expenseAvoided.trim()}`,
      });
    }
    const lesson = String(p.lessonLearned ?? "").trim();
    if (lesson.length > 0) {
      metrics.push({
        id: "insight",
        label: "Financial Insight",
        icon: "insight",
        score: clamp(60 + Math.min(lesson.length, 60), 0, 100),
        explanation: "A money lesson was captured this session",
      });
    }
    return metrics;
  },
  insight(ctx, analysis) {
    const lesson = String(ctx.proofData.lessonLearned ?? "").trim();
    if (lesson.length > 0) {
      return `Recorded an actionable money lesson. ${completionTip(analysis)}`;
    }
    return completionTip(analysis);
  },
  extraChecklist(ctx) {
    const money = toNumber(ctx.proofData.moneySaved);
    if (money <= 0) return [];
    return [{ label: "Transactions Reconciled", detail: `${formatGoalValue(money, ctx.habit.goalUnit)} accounted`, passed: true }];
  },
});

export { financeAnalyzer };
