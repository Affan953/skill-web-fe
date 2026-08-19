"use client";

import { useEffect, useState, useRef } from "react";
import SystemWindow from "@/components/system/SystemWindow";
import type { Habit, HabitCategory } from "@/types";
import type { AnalyzerResult, Rank, RankInfo, VerificationPhase } from "@/lib/verification/types";
import { starsFromScore } from "@/lib/verification/helpers";
import { formatGoal } from "@/lib/habitGoal";
import { cn } from "@/lib/cn";
import {
  CheckCircle, ArrowRight, Star, Shield, Zap, Target, AlertTriangle,
  CheckCheck, Gauge, FileCheck, Quote, Crosshair, Flame, Activity, Trophy,
  Dumbbell, BookOpen, Lightbulb, Layers, Languages, ListChecks, ShieldCheck,
  Code, GitCommit, PiggyBank, TrendingDown, Sparkles, Waves, Droplets,
  Moon, Footprints, Brain, BellOff, SlidersHorizontal, Heart, Rocket, XCircle,
  type LucideIcon,
} from "lucide-react";

interface SystemVerificationProps {
  open: boolean;
  habit: Habit | null;
  durationMinutes: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proofData: Record<string, any>;
  phase: VerificationPhase;
  progress: number;
  message: string;
  grade: RankInfo | null;
  result: AnalyzerResult | null;
  phaseLabel: string;
  onContinue: () => void;
  onStart: () => void;
}

const CATEGORY_ICONS: Record<HabitCategory, string> = {
  Learning: "📚", Fitness: "💪", Reading: "📖", Meditation: "🧘",
  Coding: "💻", Health: "💚", Productivity: "⚡", Finance: "💰",
  Language: "🗣️", Custom: "🎯",
};

const CATEGORY_COLORS_ACCENT: Record<HabitCategory, string> = {
  Learning: "#2563EB", Fitness: "#10B981", Reading: "#2563EB", Meditation: "#10B981",
  Coding: "#2563EB", Health: "#10B981", Productivity: "#2563EB", Finance: "#10B981",
  Language: "#2563EB", Custom: "#6366F1",
};

const ACTIVITY_EMOJI: Record<string, string> = {
  running: "🏃", walking: "🚶", jogging: "🏃", cycling: "🚴", swimming: "🏊",
  badminton: "🏸", football: "⚽", basketball: "🏀", "gym workout": "🏋️",
  "push up": "💪", "pull up": "💪", yoga: "🧘", stretching: "🤸", stretch: "🤸",
  book: "📖", novel: "📚", documentation: "📄", "research paper": "📑", article: "📰",
  english: "🗣️", japanese: "🗾", mathematics: "🧮", research: "🔬", "programming course": "💻",
  "build feature": "🛠️", "fix bug": "🐛", leetcode: "🧩", "code review": "🔍", refactoring: "♻️",
  "save money": "💰", "track expenses": "📊", "budget planning": "🧾", investing: "📈",
  mindfulness: "🧘", "breathing exercise": "🌬️", "focus session": "🎯",
  "drink water": "💧", sleep: "😴", medicine: "💊", "morning walk": "🌅",
  "deep work": "⚡", "task management": "✅", "email cleanup": "📧", planning: "🗂️",
};

const METRIC_ICONS: Record<string, LucideIcon> = {
  mission: Target,
  proof: FileCheck,
  reflection: Quote,
  consistency: Gauge,
  accuracy: Crosshair,
  pace: Gauge,
  calories: Flame,
  intensity: Activity,
  games: Trophy,
  peak: Dumbbell,
  difficulty: Zap,
  depth: BookOpen,
  diversity: Layers,
  vocabulary: Languages,
  problems: ListChecks,
  confidence: ShieldCheck,
  feature: Code,
  commit: GitCommit,
  savings: PiggyBank,
  expense: TrendingDown,
  insight: Lightbulb,
  calm: Sparkles,
  stress: Waves,
  hydration: Droplets,
  rest: Moon,
  mobility: Footprints,
  steps: Footprints,
  focus: Brain,
  output: ListChecks,
  interruptions: BellOff,
  metrics: SlidersHorizontal,
  commitment: Heart,
};

const UNIVERSAL_IDS = ["mission", "proof", "reflection", "consistency", "accuracy"];

const RANK_GLOW: Record<Rank, string> = {
  "S+": "rgba(245,158,11,0.4)",
  S: "rgba(16,185,129,0.4)",
  A: "rgba(37,99,235,0.4)",
  B: "rgba(100,116,139,0.35)",
  C: "rgba(245,158,11,0.35)",
};

function statusStyle(status: string): { color: string; bg: string; border: string } {
  if (status === "Excellent Mission" || status === "Successful Mission") {
    return { color: "#10B981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)" };
  }
  if (status === "Mission Completed") {
    return { color: "#2563EB", bg: "rgba(37,99,235,0.1)", border: "rgba(37,99,235,0.3)" };
  }
  if (status === "Needs Improvement") {
    return { color: "#F59E0B", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" };
  }
  return { color: "#EF4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" };
}

function statusIcon(status: string): LucideIcon {
  if (status === "Needs Improvement") return AlertTriangle;
  if (status === "Mission Incomplete") return XCircle;
  if (status === "Mission Completed") return CheckCircle;
  return Rocket;
}

function analysisStatusColor(status: string): string {
  if (status === "Excellent") return "#10B981";
  if (status === "On Track") return "#2563EB";
  if (status === "Behind") return "#F59E0B";
  return "#EF4444";
}

function CategoryDataDisplay({ category, data, accentColor }: { category: HabitCategory; /* eslint-disable-line @typescript-eslint/no-explicit-any */ data: Record<string, any>; accentColor: string }) {
  const icon = CATEGORY_ICONS[category] || "🎯";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries: { label: string; value: any; type: "text" | "bool" | "stars" | "number" }[] = [];

  const addEntry = (label: string, value: unknown, type: "text" | "bool" | "stars" | "number" = "text") => {
    if (value !== "" && value !== 0 && value !== false && value !== null && value !== undefined) entries.push({ label, value, type });
  };

  switch (category) {
    case "Language":
      addEntry("Grammar", data.grammarTopic?.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()));
      addEntry("Vocabulary", data.vocabularyCount ? `${data.vocabularyCount} Words` : null);
      addEntry("Speaking", data.speakingPractice ? "Completed" : null);
      addEntry("Listening", data.listeningPractice ? "Completed" : null);
      addEntry("Reading", data.readingPractice ? "Completed" : null);
      addEntry("Writing", data.writingPractice ? "Completed" : null);
      addEntry("Study", data.studyDuration ? `${data.studyDuration} min` : null);
      addEntry("Confidence", data.confidence, "stars");
      break;
    case "Coding":
      addEntry("Language", data.language?.charAt(0).toUpperCase() + (data.language?.slice(1) || ""));
      addEntry("Duration", data.codingDuration ? `${data.codingDuration} min` : null);
      addEntry("Problems", data.problemsSolved, "number");
      addEntry("Feature", data.featureBuilt);
      addEntry("Difficulty", data.codingDifficulty);
      addEntry("Commit", data.githubCommit ? "Available" : null);
      break;
    case "Fitness":
      addEntry("Type", data.workoutType);
      addEntry("Distance", data.distance);
      addEntry("Duration", data.duration ? `${data.duration} Minutes` : null);
      addEntry("Calories", data.calories ? `${data.calories} kcal` : null);
      addEntry("Heart Rate", data.heartRate);
      addEntry("Energy", data.energyLevel);
      addEntry("Mood", data.moodAfter);
      break;
    case "Reading":
      addEntry("Book", data.bookTitle || data.book);
      addEntry("Pages", data.pagesRead, "number");
      addEntry("Duration", data.readingDuration ? `${data.readingDuration} Minutes` : null);
      addEntry("Quote", data.favoriteQuote);
      addEntry("Lesson", data.biggestLesson);
      break;
    case "Meditation":
      addEntry("Duration", data.meditationDuration ? `${data.meditationDuration} min` : null);
      addEntry("Mood Before", data.moodBefore);
      addEntry("Mood After", data.moodAfter);
      addEntry("Stress", data.stressLevel ? `${data.stressLevel}/10` : null);
      break;
    case "Health":
      addEntry("Water", data.waterIntake ? `${data.waterIntake} glasses` : null);
      addEntry("Sleep", data.sleepDuration ? `${data.sleepDuration} hrs` : null);
      addEntry("Steps", data.steps ? data.steps.toLocaleString() : null);
      addEntry("Weight", data.weight);
      addEntry("Energy", data.energyLevel);
      break;
    case "Productivity":
      addEntry("Deep Work", data.deepWorkDuration ? `${data.deepWorkDuration} min` : null);
      addEntry("Tasks", data.tasksFinished, "number");
      addEntry("Focus", data.focusScore ? `${data.focusScore}/10` : null);
      addEntry("Interruptions", data.interruptions, "number");
      break;
    case "Finance":
      addEntry("Saved", data.moneySaved);
      addEntry("Avoided", data.expenseAvoided);
      addEntry("Lesson", data.lessonLearned);
      break;
    default:
      if (data.customMetrics && Array.isArray(data.customMetrics)) {
        data.customMetrics.forEach((m: { name: string; value: string; unit: string }) => {
          if (m.name && m.value) addEntry(m.name, m.unit ? `${m.value} ${m.unit}` : m.value);
        });
      }
      break;
  }
  addEntry("Confidence", data.confidence, "stars");

  if (entries.length === 0) return <div className="py-4 text-center text-[10px] text-[#94A3B8]">No data submitted</div>;

  return (
    <div className="space-y-1.5">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-sm">{icon}</span>
        <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-[#64748B]">{category}</span>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${accentColor}20, transparent)` }} />
      </div>
      {entries.map((entry, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2">
          <span className="text-[10px] font-medium text-[#64748B]">{entry.label}</span>
          <span className="text-[10px] font-semibold text-[#0F172A]">
            {entry.type === "stars" ? (
              <span className="flex gap-0.5">
                {Array.from({ length: 5 }, (_, j) => (
                  <Star key={j} className={cn("h-3 w-3", j < (entry.value as number) ? "text-amber-400" : "text-slate-200")} fill={j < (entry.value as number) ? "currentColor" : "none"} strokeWidth={0} />
                ))}
              </span>
            ) : entry.type === "bool" ? (
              <CheckCircle className="h-3.5 w-3.5 text-[#10B981]" />
            ) : String(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function MetricRow({ metric, tinted }: { metric: { id: string; label: string; icon: string; score: number; explanation: string }; tinted?: boolean }) {
  const Icon = METRIC_ICONS[metric.icon] || Gauge;
  const barColor = tinted
    ? "linear-gradient(90deg, #2563EB, #6366F1)"
    : "linear-gradient(90deg, #2563EB, #10B981)";
  return (
    <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-3.5 w-3.5", tinted ? "text-[#6366F1]" : "text-[#2563EB]")} />
        <p className="flex-1 text-[10px] font-semibold text-[#0F172A]">{metric.label}</p>
        <span className="flex gap-0.5">
          {Array.from({ length: 5 }, (_, j) => (
            <Star key={j} className={cn("h-2.5 w-2.5", j < starsFromScore(metric.score) ? "text-amber-400" : "text-slate-200")} fill={j < starsFromScore(metric.score) ? "currentColor" : "none"} strokeWidth={0} />
          ))}
        </span>
        <span className="w-9 text-right text-[10px] font-bold tabular-nums text-[#0F172A]">{metric.score}</span>
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${metric.score}%`, background: barColor }} />
      </div>
      <p className="mt-1 text-[9px] text-[#94A3B8]">{metric.explanation}</p>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  label,
  color = "#2563EB",
}: {
  icon: LucideIcon;
  label: string;
  color?: string;
}) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <div
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${color}12` }}
      >
        <Icon className="h-3 w-3" style={{ color }} aria-hidden="true" />
      </div>
      <span
        className="text-[9px] font-bold tracking-[0.15em] uppercase"
        style={{ color }}
      >
        {label}
      </span>
      <div
        className="h-px flex-1"
        style={{ background: `linear-gradient(to right, ${color}1a, transparent)` }}
      />
    </div>
  );
}

export default function SystemVerification({
  open, habit, proofData, phase, progress, message, grade, result, phaseLabel, onContinue, onStart,
}: SystemVerificationProps) {
  const [contentVisible, setContentVisible] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => { if (open && phase === "idle") onStart(); }, [open, phase, onStart]);
  useEffect(() => {
    if (phase === "result") {
      const t = setTimeout(() => setContentVisible(true), 250);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setContentVisible(false), 0);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "result" || !result) {
      const t = setTimeout(() => setRevealed(0), 0);
      return () => clearTimeout(t);
    }
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setRevealed(i);
      if (i >= result.checklist.length) clearInterval(interval);
    }, 240);
    return () => clearInterval(interval);
  }, [phase, result]);

  useEffect(() => {
    if (phase !== "result" || !result) {
      const raf = requestAnimationFrame(() => setDisplayScore(0));
      return () => cancelAnimationFrame(raf);
    }
    const target = result.score;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      setDisplayScore(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase, result]);

  const continueBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (phase === "result" && continueBtnRef.current) { const t = setTimeout(() => continueBtnRef.current?.focus(), 700); return () => clearTimeout(t); }
  }, [phase, contentVisible]);

  if (!habit) return null;

  const activityKey = (habit.activity ?? "").toLowerCase();
  const activityName = habit.activity || habit.category;
  const activityIcon = (activityKey && ACTIVITY_EMOJI[activityKey]) || CATEGORY_ICONS[habit.category] || "🎯";
  const accent = CATEGORY_COLORS_ACCENT[habit.category] || "#2563EB";
  const isResult = phase === "result";
  const today = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const goal = formatGoal(habit);
  const activitySpecific = result?.quality.filter((m) => !UNIVERSAL_IDS.includes(m.id)) ?? [];

  return (
    <SystemWindow open={open} onClose={() => {}} title="" subtitle="" maxWidth="max-w-[640px]">
      {/* === Scanning phases === */}
      {!isResult && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <Shield className="h-4 w-4 text-[#2563EB]" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#2563EB]">System</span>
              <Shield className="h-4 w-4 text-[#2563EB]" />
            </div>
            <h2 className="text-lg font-bold text-[#0F172A]">Mission Verification</h2>
          </div>

          <div className="flex items-center justify-center gap-2.5 rounded-xl border border-slate-100 bg-[#FAFBFC] px-4 py-2.5">
            <span className="text-base">{activityIcon}</span>
            <div className="text-left">
              <p className="text-xs font-semibold text-[#0F172A]">{activityName}</p>
              {habit.activity && habit.activity !== habit.title && (
                <p className="text-[9px] text-[#94A3B8]">{habit.title} · {today}</p>
              )}
              {(!habit.activity || habit.activity === habit.title) && (
                <p className="text-[9px] text-[#94A3B8]">{today}</p>
              )}
            </div>
            {goal.value && (
              <span className="ml-1 rounded-lg border border-[#2563EB]/15 bg-[#2563EB]/5 px-2 py-1 text-[9px] font-semibold text-[#2563EB]">
                Target · {goal.value}
              </span>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs font-medium text-[#64748B] transition-all duration-300">{phaseLabel}</p>
            {message && <p className="mt-0.5 text-[10px] font-medium text-[#2563EB] transition-all duration-300">{message}</p>}
          </div>

          <div className="relative">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/60">
              <div className="h-full rounded-full transition-all duration-200 ease-out" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${accent}, ${accent}cc)`, boxShadow: `0 0 8px ${accent}25` }} />
            </div>
          </div>
          <div className="text-center">
            <span className="text-xl font-bold tabular-nums" style={{ color: accent }}>{Math.round(progress)}</span>
            <span className="ml-0.5 text-[10px] text-[#94A3B8]">%</span>
          </div>

          {(phase === "analyzing" || phase === "comparing") && (
            <div className="rounded-xl border border-slate-100 bg-[#FAFBFC] p-3">
              <CategoryDataDisplay category={habit.category} data={proofData} accentColor={accent} />
            </div>
          )}
        </div>
      )}

      {/* === Result phase === */}
      {isResult && grade && result && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-xl border border-[#2563EB]/20 bg-[#2563EB]/5 px-4 py-2">
              <CheckCircle className="h-4 w-4 text-[#2563EB]" />
              <span className="text-sm font-bold text-[#2563EB]">Mission Verified</span>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2.5 rounded-xl border border-slate-100 bg-[#FAFBFC] px-4 py-2.5">
              <span className="text-base">{activityIcon}</span>
              <div className="text-left">
                <p className="text-xs font-semibold text-[#0F172A]">{activityName}</p>
                {habit.activity && habit.activity !== habit.title && (
                  <p className="text-[9px] text-[#94A3B8]">{habit.title} · {today}</p>
                )}
                {(!habit.activity || habit.activity === habit.title) && (
                  <p className="text-[9px] text-[#94A3B8]">{today}</p>
                )}
              </div>
              {goal.value && (
                <span className="ml-1 rounded-lg border border-[#2563EB]/15 bg-[#2563EB]/5 px-2 py-1 text-[9px] font-semibold text-[#2563EB]">
                  Target · {goal.value}
                </span>
              )}
            </div>
          </div>

          {/* Animated checklist */}
          {contentVisible && (
            <div className="rounded-xl border border-slate-100 bg-[#FAFBFC] p-3">
              <SectionHeader icon={ListChecks} label="Verification Checklist" />
              <div className="space-y-1.5">
                {result.checklist.slice(0, revealed).map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-white px-3 py-2">
                    <div
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                        item.passed
                          ? "bg-[#10B981]/10 text-[#10B981]"
                          : "bg-amber-400/10 text-amber-500"
                      )}
                    >
                      {item.passed ? (
                        <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-[10px] font-semibold", item.passed ? "text-[#0F172A]" : "text-[#64748B]")}>{item.label}</p>
                      <p className="truncate text-[9px] text-[#94A3B8]">{item.detail}</p>
                    </div>
                    {item.passed && <CheckCheck className="h-3 w-3 shrink-0 text-[#10B981]" aria-hidden="true" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mission Analysis Card */}
          {contentVisible && (
            <div className="rounded-xl border border-slate-100 bg-white p-3">
              <SectionHeader icon={Target} label="Mission Analysis" />
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-slate-100 bg-[#FAFBFC] px-3 py-2">
                  <p className="text-[8px] font-semibold uppercase tracking-wider text-[#94A3B8]">{result.analysis.goalLabel}</p>
                  <p className="text-sm font-bold text-[#0F172A]">{result.analysis.goalValue}</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-[#FAFBFC] px-3 py-2">
                  <p className="text-[8px] font-semibold uppercase tracking-wider text-[#94A3B8]">Completed</p>
                  <p className="text-sm font-bold text-[#10B981]">{result.analysis.completedLabel}</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-[#FAFBFC] px-3 py-2">
                  <p className="text-[8px] font-semibold uppercase tracking-wider text-[#94A3B8]">Completion</p>
                  <p className="text-sm font-bold text-[#0F172A]">{result.analysis.completionPercent}%</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-[#FAFBFC] px-3 py-2">
                  <p className="text-[8px] font-semibold uppercase tracking-wider text-[#94A3B8]">Status</p>
                  <p className="text-sm font-bold" style={{ color: analysisStatusColor(result.analysis.status) }}>{result.analysis.status}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quality Analysis */}
          {contentVisible && (
            <div className="rounded-xl border border-slate-100 bg-[#FAFBFC] p-3">
              <SectionHeader icon={Gauge} label="Quality Analysis" />
              <div className="space-y-1.5">
                {result.quality.filter((m) => UNIVERSAL_IDS.includes(m.id)).map((m) => (
                  <MetricRow key={m.id} metric={m} />
                ))}
              </div>
            </div>
          )}

          {/* Activity Specific Analysis */}
          {contentVisible && activitySpecific.length > 0 && (
            <div
              className="rounded-xl border p-3"
              style={{ borderColor: "rgba(99,102,241,0.2)", background: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(255,255,255,0.5))" }}
            >
              <SectionHeader icon={Activity} label="Activity Specific Analysis" color="#6366F1" />
              <div className="space-y-1.5">
                {activitySpecific.map((m) => (
                  <MetricRow key={m.id} metric={m} tinted />
                ))}
              </div>
            </div>
          )}

          {/* Overall Score + Mission Rank */}
          {contentVisible && (
            <div
              className="relative overflow-hidden rounded-2xl border p-5 text-center"
              style={{
                borderColor: "rgba(37,99,235,0.2)",
                background: "linear-gradient(135deg, rgba(37,99,235,0.09), rgba(255,255,255,0.55))",
                boxShadow: "0 0 30px rgba(37,99,235,0.14), inset 0 0 40px rgba(37,99,235,0.03)",
              }}
            >
              <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full" style={{ background: "radial-gradient(circle, rgba(37,99,235,0.12), transparent)" }} />
              <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.1), transparent)" }} />

              <p className="relative mb-4 text-[9px] font-bold tracking-[0.2em] uppercase text-[#64748B]">Overall Mission Score</p>

              <div className="relative flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
                {/* Score ring */}
                <div className="relative h-28 w-28 rounded-full" style={{ background: `conic-gradient(#2563EB ${displayScore * 3.6}deg, rgba(37,99,235,0.12) 0deg)`, boxShadow: "0 0 20px rgba(37,99,235,0.15)" }}>
                  <div className="absolute inset-1.5 flex items-center justify-center rounded-full bg-white/90">
                    <div>
                      <p className="text-3xl font-black tabular-nums text-[#0F172A]">{displayScore}</p>
                      <p className="text-[8px] font-semibold uppercase tracking-wider text-[#94A3B8]">/ 100</p>
                    </div>
                  </div>
                </div>

                {/* Mission Rank */}
                <div className="text-center sm:text-left">
                  <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#64748B]">Mission Rank</p>
                  <div className="relative inline-block">
                    <span className={cn("text-6xl font-black tracking-tight", grade.color)} style={{ textShadow: `0 2px 18px ${RANK_GLOW[grade.grade]}` }}>
                      {grade.grade}
                    </span>
                    <span className="absolute -top-1 -right-3 text-[10px] text-amber-400">★</span>
                  </div>
                  <p className={cn("text-xs font-semibold", grade.color)}>{grade.label}</p>
                  <p className="mt-1 text-[9px] text-[#94A3B8]">+XP Earned</p>
                </div>
              </div>
            </div>
          )}

          {/* Mission Insight */}
          {contentVisible && (
            <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
              <SectionHeader icon={Lightbulb} label="Mission Insight" color="#F59E0B" />
              <p className="text-[11px] font-medium leading-relaxed text-[#0F172A]">{result.insight}</p>
            </div>
          )}

          {/* Status + Continue */}
          {contentVisible && (
            <div className="flex items-center gap-3">
              {(() => {
                const st = statusStyle(result.status);
                const Icon = statusIcon(result.status);
                return (
                  <div className="inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5" style={{ color: st.color, background: st.bg, border: `1px solid ${st.border}` }}>
                    <span className="relative flex h-2 w-2" aria-hidden="true">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: st.color }} />
                      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: st.color }} />
                    </span>
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="text-[10px] font-bold whitespace-nowrap">{result.status}</span>
                  </div>
                );
              })()}
              <button
                ref={continueBtnRef}
                onClick={onContinue}
                className="group flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-xs font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-[#2563EB]/25 hover:-translate-y-0.5"
              >
                Continue to Reflection
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </SystemWindow>
  );
}
