"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Habit, HabitCategory } from "@/types";
import type { AnalyzerResult, Rank, RankInfo, VerificationPhase } from "@/lib/verification/types";
import { missionVerificationEngine } from "@/lib/verification/engine";

const GRADES: Record<Rank, RankInfo> = {
  "S+": { grade: "S+", label: "Outstanding", color: "text-amber-500", bg: "bg-amber-500/10", score: 0 },
  S: { grade: "S", label: "Exceptional", color: "text-[#10B981]", bg: "bg-[#10B981]/10", score: 0 },
  A: { grade: "A", label: "Excellent", color: "text-[#2563EB]", bg: "bg-[#2563EB]/10", score: 0 },
  B: { grade: "B", label: "Good", color: "text-slate-500", bg: "bg-slate-100", score: 0 },
  C: { grade: "C", label: "Needs Work", color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10", score: 0 },
};

const CATEGORY_MESSAGES: Record<HabitCategory, string[]> = {
  Learning: ["Knowledge acquisition confirmed.", "Learning progress verified.", "Study session analyzed."],
  Fitness: ["Physical activity detected.", "Workout intensity verified.", "Fitness progress confirmed."],
  Reading: ["Reading habit maintained.", "Literary progress analyzed.", "Page count verified."],
  Meditation: ["Mindfulness session verified.", "Meditation practice confirmed.", "Mental clarity analyzed."],
  Coding: ["Coding session verified.", "Development progress confirmed.", "Code contribution analyzed."],
  Health: ["Health metrics reviewed.", "Wellness data verified.", "Health habit confirmed."],
  Productivity: ["Productivity analyzed.", "Task completion verified.", "Focus session confirmed."],
  Finance: ["Financial discipline confirmed.", "Spending data analyzed.", "Savings verified."],
  Language: ["Language practice verified.", "Vocabulary growth confirmed.", "Language skill analyzed."],
  Custom: ["Custom metrics analyzed.", "Session data verified.", "Progress confirmed."],
  Uncategorized: ["Session data verified.", "Progress confirmed.", "Activity analyzed."],
};

const PHASE_LABELS: Record<VerificationPhase, string> = {
  idle: "",
  scanning: "Scanning...",
  analyzing: "Analyzing...",
  comparing: "Comparing Previous Performance...",
  result: "Mission Verified",
};

interface UseMissionVerificationOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proofData: Record<string, any>;
  category: HabitCategory;
  durationMinutes: number;
  habit: Habit | null;
  reflection?: string;
  onVerified: (grade: RankInfo) => void;
}

function legacyGrade(score: number): RankInfo {
  if (score >= 80) return GRADES.S;
  if (score >= 60) return GRADES.A;
  if (score >= 40) return GRADES.B;
  return GRADES.C;
}

export default function useMissionVerification({
  proofData,
  category,
  durationMinutes,
  habit,
  reflection,
  onVerified,
}: UseMissionVerificationOptions) {
  const [phase, setPhase] = useState<VerificationPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [grade, setGrade] = useState<RankInfo | null>(null);
  const [result, setResult] = useState<AnalyzerResult | null>(null);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const onVerifiedRef = useRef(onVerified);

  useEffect(() => {
    onVerifiedRef.current = onVerified;
  }, [onVerified]);

  const startVerification = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
    if (progressRef.current) clearInterval(progressRef.current);

    setPhase("scanning");
    setProgress(0);
    setMessage("");
    setGrade(null);
    setResult(null);

    const messages = CATEGORY_MESSAGES[category] || CATEGORY_MESSAGES.Custom;
    setMessage(messages[Math.floor(Math.random() * messages.length)]);

    let currentProgress = 0;
    progressRef.current = setInterval(() => {
      currentProgress += 1.5 + Math.random() * 2;
      if (currentProgress > 95) currentProgress = 95;
      setProgress(currentProgress);
    }, 40);

    timersRef.current.push(
      setTimeout(() => {
        setPhase("analyzing");
        const m2 = messages[Math.floor(Math.random() * messages.length)];
        setMessage(m2);
      }, 800)
    );

    timersRef.current.push(
      setTimeout(() => {
        setPhase("comparing");
        const m3 = messages[Math.floor(Math.random() * messages.length)];
        setMessage(m3);
      }, 1600)
    );

    timersRef.current.push(
      setTimeout(() => {
        let computed: RankInfo;
        let computedResult: AnalyzerResult | null = null;
        if (habit) {
          computedResult = missionVerificationEngine.analyze({
            habit,
            durationMinutes,
            proofData,
            reflection,
          });
          const base = GRADES[computedResult.rank];
          computed = { ...base, score: computedResult.score };
        } else {
          const fieldCount = Object.keys(proofData).filter(
            (k) => proofData[k] !== "" && proofData[k] !== 0 && proofData[k] !== false && proofData[k] !== null && proofData[k] !== undefined
          ).length;
          computed = legacyGrade(Math.min(40 + fieldCount * 10, 100));
        }
        setGrade(computed);
        setResult(computedResult);
        setProgress(100);
        setMessage("Mission Verified");
        setPhase("result");

        if (progressRef.current) clearInterval(progressRef.current);
        onVerifiedRef.current(computed);
      }, 2600)
    );
  }, [proofData, durationMinutes, category, habit, reflection]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    setPhase("idle");
    setProgress(0);
    setMessage("");
    setGrade(null);
    setResult(null);
  }, []);

  return {
    phase,
    progress,
    message,
    grade,
    result,
    phaseLabel: PHASE_LABELS[phase],
    startVerification,
    reset,
  };
}
