import type { MissionAnalysis, Rank } from "@/lib/verification/types";

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function toNumber(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (v == null) return 0;
  if (typeof v !== "string") return 0;
  let s = v.trim();
  if (s === "") return 0;
  // Indonesian-style thousands separator: "50.000" → 50000
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
    s = s.replace(/\./g, "").replace(/,/g, ".");
  } else {
    s = s.replace(/,/g, "").replace(/[^\d.\-]/g, "");
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function hasValue(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "boolean") return true;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return true;
}

export function completionPercent(completed: number, target: number): number {
  if (!target || target <= 0) return completed > 0 ? 100 : 0;
  return Math.round((completed / target) * 100);
}

export function scoreToRank(score: number): Rank {
  if (score >= 90) return "S+";
  if (score >= 80) return "S";
  if (score >= 65) return "A";
  if (score >= 50) return "B";
  return "C";
}

export function starsFromScore(score: number): number {
  return clamp(Math.round((score / 100) * 5), 1, 5);
}

export function statusFromScore(score: number): string {
  if (score >= 85) return "Excellent Mission";
  if (score >= 70) return "Successful Mission";
  if (score >= 55) return "Mission Completed";
  if (score >= 40) return "Needs Improvement";
  return "Mission Incomplete";
}

export function energyScore(v: unknown): number {
  switch (String(v ?? "").toLowerCase()) {
    case "peak":
      return 100;
    case "high":
      return 85;
    case "medium":
      return 65;
    case "low":
      return 40;
    default:
      return 50;
  }
}

export function moodScore(v: unknown): number {
  const m = String(v ?? "").toLowerCase();
  if (["amazing", "peaceful", "focused", "happy", "energized"].includes(m)) return 90;
  if (["great", "calm", "good"].includes(m)) return 75;
  if (["neutral"].includes(m)) return 60;
  if (["tired", "stressed", "anxious"].includes(m)) return 40;
  return 50;
}

export function confidenceScore(v: unknown): number {
  const s = String(v ?? "").toLowerCase();
  if (s === "very confident") return 100;
  if (s === "confident") return 85;
  if (s === "okay") return 65;
  if (s === "not confident") return 40;
  const n = toNumber(v);
  if (n > 0) return clamp(Math.round(n * 20), 20, 100);
  return 50;
}

// Parses pace strings like "6:30", "6'30\"", "6.5" (minutes/km) into seconds/km.
export function parsePaceSeconds(v: unknown): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (s === "") return null;
  const m = s.match(/(\d+(?:\.\d+)?)\s*[:/'"]+\s*(\d+(?:\.\d+)?)?/);
  if (m) {
    const min = parseFloat(m[1]);
    const sec = m[2] ? parseFloat(m[2]) : 0;
    if (Number.isFinite(min)) return Math.round(min * 60 + sec);
  }
  const n = toNumber(s);
  if (n > 0) return Math.round(n * 60);
  return null;
}

export function paceText(seconds: number): string {
  return `${Math.floor(seconds / 60)}'${String(Math.round(seconds % 60)).padStart(2, "0")}"`;
}

export function completionTip(analysis: MissionAnalysis): string {
  if (analysis.completionPercent >= 100) {
    return "Target met — push slightly further next session to keep improving.";
  }
  if (analysis.completionPercent >= 80) {
    return "Close to target — a small extra effort locks in the goal.";
  }
  if (analysis.completionPercent >= 50) {
    return "Halfway there — raising session length builds momentum.";
  }
  return "Target missed — adjust the goal to stay consistent.";
}
