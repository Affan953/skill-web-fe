import type { LucideIcon } from "lucide-react";
import {
  ShieldCheck,
  BookOpen,
  Sparkles,
  Award,
  Star,
  Target,
  Map,
  Flame,
  Languages,
  Dumbbell,
  Code,
  HeartPulse,
  Briefcase,
  Coins,
  Feather,
  CheckCircle2,
  Trophy,
} from "lucide-react";

export type SystemNotificationType =
  | "MISSION_VERIFIED"
  | "REFLECTION_SAVED"
  | "JOURNEY_RECORDED"
  | "XP_GAINED"
  | "LEVEL_UP"
  | "STREAK_UPDATED"
  | "ACHIEVEMENT_UNLOCKED"
  | "QUEST_COMPLETED"
  | "CATEGORY_IMPROVED"
  | "NEW_TITLE"
  | "WEEKLY_REVIEW"
  | "MONTHLY_REPORT";

export type NotificationPriority = "low" | "normal" | "high";

export interface SystemNotificationData {
  id?: string;
  type: SystemNotificationType;
  title: string;
  description?: string;
  icon?: LucideIcon;
  category?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: Record<string, any>;
  priority?: NotificationPriority;
  duration?: number;
  fullWidth?: boolean;
  /** Suppress the automatic sound for this notification (e.g. a dedicated
   *  sound is played separately). */
  silent?: boolean;
}

export interface QueuedNotification extends SystemNotificationData {
  id: string;
  timestamp: number;
}

export const NOTIFICATION_CATEGORY_ICONS: Record<string, LucideIcon> = {
  language: Languages,
  fitness: Dumbbell,
  reading: BookOpen,
  coding: Code,
  health: HeartPulse,
  productivity: Briefcase,
  finance: Coins,
  meditation: Feather,
};

export const NOTIFICATION_TYPE_ICONS: Record<string, LucideIcon> = {
  MISSION_VERIFIED: ShieldCheck,
  REFLECTION_SAVED: BookOpen,
  JOURNEY_RECORDED: Map,
  XP_GAINED: Sparkles,
  LEVEL_UP: Star,
  STREAK_UPDATED: Flame,
  ACHIEVEMENT_UNLOCKED: Award,
  QUEST_COMPLETED: Target,
  CATEGORY_IMPROVED: Sparkles,
  NEW_TITLE: Trophy,
  WEEKLY_REVIEW: CheckCircle2,
  MONTHLY_REPORT: CheckCircle2,
};

export const DEFAULT_NOTIFICATION_ICON: LucideIcon = ShieldCheck;

export function getNotificationIcon(
  type: SystemNotificationType,
  category?: string
): LucideIcon {
  if (category) {
    const categoryIcon = NOTIFICATION_CATEGORY_ICONS[category.toLowerCase()];
    if (categoryIcon) return categoryIcon;
  }
  return NOTIFICATION_TYPE_ICONS[type] || DEFAULT_NOTIFICATION_ICON;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sound abstraction using Web Audio API synthesis (no audio files needed!)
//
// A SINGLE shared AudioContext is reused across the app. Browsers block audio
// until the user interacts with the page, so we unlock it on the first
// interaction (pointer/keyboard). After that, sounds scheduled later (e.g. a
// countdown finishing) play reliably — unlike a fresh context per sound, which
// stays suspended under autoplay rules.
// ─────────────────────────────────────────────────────────────────────────────

let audioCtx: AudioContext | null = null;

type AudioContextCtor = typeof AudioContext;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor: AudioContextCtor | undefined =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: AudioContextCtor })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) {
    audioCtx = new Ctor();
  }
  return audioCtx;
}

/** Resumes the shared audio context (must follow a user gesture). */
export function unlockAudio(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
}

/**
 * Attaches a one-time global listener so the shared context is unlocked on the
 * user's first interaction. Returns a cleanup function.
 */
export function attachAudioUnlock(): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    unlockAudio();
    window.removeEventListener("pointerdown", handler);
    window.removeEventListener("keydown", handler);
  };
  window.addEventListener("pointerdown", handler);
  window.addEventListener("keydown", handler);
  return () => {
    window.removeEventListener("pointerdown", handler);
    window.removeEventListener("keydown", handler);
  };
}

function playTone(
  freq: number,
  type: OscillatorType = "sine",
  duration = 0.15,
  gainVal = 0.1,
  delay = 0
) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    const startAt = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(gainVal, startAt + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startAt);
    osc.stop(startAt + duration + 0.05);
  } catch {
    // Ignore audio context autoplay restrictions
  }
}

/**
 * Plays a bundled audio file (e.g. an iPhone notification sound) from the
 * public/ directory. Used instead of synthesized tones for notification sounds.
 */
function playAudioFile(path: string): void {
  if (typeof window === "undefined") return;
  try {
    unlockAudio();
    const audio = new Audio(path);
    audio.volume = 0.9;
    void audio.play().catch(() => {
      // Ignore autoplay restrictions; the context is unlocked on first
      // interaction so later plays should succeed.
    });
  } catch {
    // Ignore autoplay restrictions
  }
}

/**
 * "Ting" iPhone notification sound (tri-tone). Used for routine notifications.
 */
export function playIphoneTing(): void {
  playAudioFile("/iphonething.mp3");
}

/**
 * "Circles" iPhone notification sound. Used for high-importance notifications.
 */
export function playIphoneCircles(): void {
  playAudioFile("/IphoneCircles.mp3");
}

export function playMissionSound(): void {
  playTone(523.25, "triangle", 0.2, 0.1);
  playTone(659.25, "triangle", 0.25, 0.1, 0.1);
}

export function playLevelUpSound(): void {
  playTone(440, "sawtooth", 0.12, 0.12);
  playTone(554.37, "sawtooth", 0.12, 0.12, 0.1);
  playTone(659.25, "sawtooth", 0.12, 0.12, 0.2);
  playTone(880, "sawtooth", 0.35, 0.15, 0.3);
}

export function playAchievementSound(): void {
  playTone(587.33, "sine", 0.12, 0.12);
  playTone(739.99, "sine", 0.12, 0.12, 0.1);
  playTone(880, "sine", 0.25, 0.15, 0.2);
}

export function playXpSound(): void {
  playTone(880, "sine", 0.08, 0.08);
  playTone(1046.5, "sine", 0.12, 0.08, 0.07);
}

export function playQuestSound(): void {
  playTone(659.25, "sine", 0.1, 0.05);
  playTone(830.61, "sine", 0.12, 0.05, 0.09);
  playTone(987.77, "sine", 0.16, 0.05, 0.19);
}

export function playSoftBlip(): void {
  playTone(659.25, "sine", 0.07, 0.035);
  playTone(880, "sine", 0.1, 0.035, 0.07);
}

/** Subtle tick for the final seconds of a countdown (stopwatch feel). */
export function playTimerTick(): void {
  playTone(1046.5, "sine", 0.07, 0.08);
}

/** Clear, pleasant chime when a countdown session finishes. */
export function playTimerCompleteSound(): void {
  playTone(523.25, "sine", 0.45, 0.13);
  playTone(659.25, "sine", 0.45, 0.13, 0.13);
  playTone(783.99, "sine", 0.5, 0.13, 0.26);
  playTone(1046.5, "sine", 0.7, 0.15, 0.4);
}
