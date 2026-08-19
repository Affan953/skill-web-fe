"use client";

import { useState, useEffect } from "react";
import type { QueuedNotification } from "@/lib/systemNotification";
import {
  DEFAULT_NOTIFICATION_ICON,
  NOTIFICATION_CATEGORY_ICONS,
  NOTIFICATION_TYPE_ICONS,
} from "@/lib/systemNotification";
import { cn } from "@/lib/cn";
import { Star, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";

interface SystemNotificationProps {
  notification: QueuedNotification;
  isShowing: boolean;
}

const TYPE_COLORS: Record<string, { accent: string; glow: string; border: string }> = {
  MISSION_VERIFIED: { accent: "#2563EB", glow: "rgba(37,99,235,0.18)", border: "rgba(37,99,235,0.28)" },
  REFLECTION_SAVED: { accent: "#10B981", glow: "rgba(16,185,129,0.18)", border: "rgba(16,185,129,0.28)" },
  JOURNEY_RECORDED: { accent: "#2563EB", glow: "rgba(37,99,235,0.18)", border: "rgba(37,99,235,0.28)" },
  XP_GAINED: { accent: "#10B981", glow: "rgba(16,185,129,0.2)", border: "rgba(16,185,129,0.3)" },
  LEVEL_UP: { accent: "#F59E0B", glow: "rgba(245,158,11,0.3)", border: "rgba(245,158,11,0.4)" },
  STREAK_UPDATED: { accent: "#F97316", glow: "rgba(249,115,22,0.18)", border: "rgba(249,115,22,0.28)" },
  ACHIEVEMENT_UNLOCKED: { accent: "#F59E0B", glow: "rgba(245,158,11,0.2)", border: "rgba(245,158,11,0.3)" },
  QUEST_COMPLETED: { accent: "#8B5CF6", glow: "rgba(139,92,246,0.18)", border: "rgba(139,92,246,0.28)" },
  CATEGORY_IMPROVED: { accent: "#10B981", glow: "rgba(16,185,129,0.18)", border: "rgba(16,185,129,0.28)" },
  NEW_TITLE: { accent: "#EC4899", glow: "rgba(236,72,153,0.18)", border: "rgba(236,72,153,0.28)" },
  WEEKLY_REVIEW: { accent: "#2563EB", glow: "rgba(37,99,235,0.18)", border: "rgba(37,99,235,0.28)" },
  MONTHLY_REPORT: { accent: "#2563EB", glow: "rgba(37,99,235,0.18)", border: "rgba(37,99,235,0.28)" },
};

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const end = value;
    const startTime = performance.now();

    const updateNumber = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / 1000, 1);
      const current = Math.floor(progress * end);
      setDisplay(current);
      if (progress < 1) {
        requestAnimationFrame(updateNumber);
      }
    };

    const raf = requestAnimationFrame(updateNumber);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display.toLocaleString()}</>;
}

export default function SystemNotification({
  notification,
  isShowing,
}: SystemNotificationProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const colors = TYPE_COLORS[notification.type] || TYPE_COLORS.MISSION_VERIFIED;
  const Icon =
    notification.icon ||
    NOTIFICATION_CATEGORY_ICONS[notification.category?.toLowerCase() ?? ""] ||
    NOTIFICATION_TYPE_ICONS[notification.type] ||
    DEFAULT_NOTIFICATION_ICON;

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (isShowing) {
      const raf = requestAnimationFrame(() => {
        setMounted(true);
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(raf);
    }
    const hide = setTimeout(() => setVisible(false), 0);
    const unmount = setTimeout(() => setMounted(false), 400);
    return () => {
      clearTimeout(hide);
      clearTimeout(unmount);
    };
  }, [isShowing]);

  if (!mounted) return null;

  // ─── Fullscreen Level Up Overlay ────────────────────────────────────────────
  if (notification.type === "LEVEL_UP") {
    const levelVal = notification.meta?.level || 2;
    const prevLevel = notification.meta?.prevLevel || levelVal - 1;

    return (
      <div
        aria-live="polite"
        role="dialog"
        aria-modal="true"
        aria-label="Level Up"
        className={cn(
          "fixed inset-0 z-[110] flex items-center justify-center p-4 transition-all duration-500",
          visible
            ? "opacity-100 backdrop-blur-sm bg-[#0F172A]/50"
            : "opacity-0 pointer-events-none"
        )}
      >
        <div
          className={cn(
            "relative w-full max-w-md overflow-hidden rounded-3xl border-2 p-8 text-center transition-all duration-500",
            visible ? "scale-100 translate-y-0" : "scale-90 translate-y-8"
          )}
          style={{
            background: "linear-gradient(165deg, #FFFFFF 0%, #FFFBEB 100%)",
            borderColor: colors.border,
            boxShadow: `0 0 60px ${colors.glow}, 0 25px 60px rgba(15,23,42,0.25)`,
          }}
        >
          {/* Top glow accent */}
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent" />

          {/* Glowing pulse ring */}
          <div
            className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2"
            style={{
              borderColor: colors.border,
              background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))",
              boxShadow: "0 0 40px rgba(245,158,11,0.25)",
            }}
          >
            <Star className="h-12 w-12 text-[#F59E0B] animate-pulse" />
          </div>

          {/* SYSTEM HEADER */}
          <div className="mb-3 flex items-center justify-center gap-2">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#F59E0B]/60" />
            <span className="text-xs font-extrabold uppercase tracking-[0.3em] text-[#F59E0B]">
              System
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#F59E0B]/60" />
          </div>

          {/* LEVEL UP TITLE */}
          <h2
            className="text-3xl font-black uppercase tracking-wider text-transparent bg-clip-text"
            style={{
              backgroundImage: "linear-gradient(135deg, #D97706 0%, #F59E0B 45%, #FBBF24 100%)",
            }}
          >
            Level Up
          </h2>

          {/* Level Transition */}
          <div className="mt-6 flex items-center justify-center gap-4 rounded-2xl border border-[#FDE68A] bg-white p-4">
            <span className="text-xl font-bold text-slate-400">Level {prevLevel}</span>
            <ArrowRight className="h-5 w-5 text-[#F59E0B]" />
            <span className="text-2xl font-black text-[#F59E0B]">Level {levelVal}</span>
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-500">
            {notification.description || "New Growth Achieved"}
          </p>

          {/* Continue Action */}
          <div className="mt-8">
            <button
              onClick={() => setVisible(false)}
              className="w-full rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] py-3 text-sm font-bold text-white shadow-[0_8px_25px_rgba(245,158,11,0.4)] transition-all hover:scale-[1.02] active:scale-[0.99]"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Standard Floating System Toast ─────────────────────────────────────────
  const duration = notification.duration || 3000;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      role="status"
      className={cn(
        "fixed top-20 right-4 z-[100] w-full max-w-sm transition-all duration-500",
        visible
          ? "translate-x-0 opacity-100"
          : "translate-x-8 opacity-0 pointer-events-none"
      )}
      style={{ willChange: "transform, opacity" }}
    >
      <div
        className="relative overflow-hidden rounded-2xl border p-5"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderColor: colors.border,
          boxShadow: `0 0 30px ${colors.glow}, 0 20px 45px rgba(15,23,42,0.14)`,
        }}
      >
        {/* Top glow line */}
        <div
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{
            background: `linear-gradient(to right, transparent, ${colors.accent}, transparent)`,
          }}
        />

        {/* Scanline animation */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-x-0 h-px opacity-40"
            style={{
              background: `linear-gradient(to right, transparent, ${colors.accent}, transparent)`,
              animation: prefersReduced ? "none" : "snScanline 2.5s linear infinite",
            }}
          />
        </div>

        {/* Header bar */}
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5" style={{ color: colors.accent }} />
            <span
              className="text-[10px] font-extrabold uppercase tracking-[0.25em]"
              style={{ color: colors.accent }}
            >
              System
            </span>
          </div>
          {notification.category && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {notification.category}
            </span>
          )}
        </div>

        {/* Main Content */}
        <div className="flex items-start gap-3.5">
          {Icon && (
            <div
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}cc)`,
                boxShadow: `0 8px 20px ${colors.glow}`,
              }}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold leading-snug text-[#0F172A]">
              {notification.title}
            </h4>

            {notification.description && (
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {notification.description}
              </p>
            )}

            {/* XP GAINED Animated Counter */}
            {notification.type === "XP_GAINED" && notification.meta?.xpEarned && (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-[#10B981]/20 bg-[#10B981]/5 p-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase text-slate-400">
                    Acquired
                  </p>
                  <p className="text-lg font-black text-[#10B981]">
                    +<AnimatedNumber value={Number(notification.meta.xpEarned)} /> XP
                  </p>
                </div>
                {notification.meta.totalXp && (
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase text-slate-400">
                      Current XP
                    </p>
                    <p className="text-xs font-bold text-slate-700">
                      {notification.meta.totalXp}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* MISSION VERIFIED Performance Grade */}
            {notification.type === "MISSION_VERIFIED" && notification.meta?.grade && (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-[#2563EB]/20 bg-[#2563EB]/5 p-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase text-slate-400">
                    Performance Grade
                  </p>
                  <p className="text-xs font-bold text-[#2563EB]">
                    {notification.meta.performanceLabel || "Completed"}
                  </p>
                </div>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-black text-white"
                  style={{
                    background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                    boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
                  }}
                >
                  {notification.meta.grade}
                </div>
              </div>
            )}

            {/* ACHIEVEMENT UNLOCKED */}
            {notification.type === "ACHIEVEMENT_UNLOCKED" && notification.meta?.reward && (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-[#F59E0B]/25 bg-[#F59E0B]/10 p-3">
                <span className="text-xs font-bold text-[#D97706]">
                  Reward: +{notification.meta.reward} XP
                </span>
                <CheckCircle2 className="h-4 w-4 text-[#F59E0B]" />
              </div>
            )}

            {/* Category Specific Details */}
            {notification.meta &&
              notification.type !== "XP_GAINED" &&
              notification.type !== "MISSION_VERIFIED" &&
              notification.type !== "ACHIEVEMENT_UNLOCKED" && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {Object.entries(notification.meta).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1"
                    >
                      <span className="text-[10px] capitalize text-slate-500">
                        {key.replace(/([A-Z])/g, " $1").trim()}:
                      </span>
                      <span className="text-[11px] font-bold text-slate-800">
                        {String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>

        {/* Footer text if specified */}
        {(notification.type === "MISSION_VERIFIED" || notification.type === "REFLECTION_SAVED") && (
          <div className="mt-3 border-t border-slate-100 pt-2 text-right">
            <span
              className="text-[10px] font-semibold tracking-wider"
              style={{ color: colors.accent }}
            >
              {notification.type === "MISSION_VERIFIED" ? "Continue Your Journey →" : "Growth Journal Updated."}
            </span>
          </div>
        )}

        {/* Auto-dismiss progress bar */}
        {visible && (
          <div
            className="absolute bottom-0 left-0 h-[3px] rounded-r-full"
            style={{
              background: `linear-gradient(90deg, ${colors.accent}66, ${colors.accent})`,
              boxShadow: `0 0 10px ${colors.glow}`,
              animation: prefersReduced ? "none" : `snProgress ${duration}ms linear forwards`,
            }}
          />
        )}

        {/* Keyframes */}
        <style jsx global>{`
          @keyframes snScanline {
            0% { top: -2px; }
            100% { top: 100%; }
          }
          @keyframes snProgress {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}</style>
      </div>
    </div>
  );
}
