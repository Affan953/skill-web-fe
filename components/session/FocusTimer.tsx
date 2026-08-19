"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Pause, Play, Maximize2, Minimize2, Flag, ShieldCheck, Clock, Zap, Flame, Target, TimerReset } from "lucide-react";
import type { Habit } from "@/types";
import { cn } from "@/lib/cn";
import { formatGoal, isTimedSession } from "@/lib/habitGoal";
import useSystemNotification from "@/hooks/useSystemNotification";
import {
  playTimerTick,
  playTimerCompleteSound,
} from "@/lib/systemNotification";
import { CATEGORY_MOTIVATIONAL_MESSAGES } from "@/lib/sessionContext";

interface FocusTimerProps {
  habit: Habit;
  onFinish: (durationMinutes: number) => void;
  onCancel: () => void;
}

function formatCurrentTime(): string {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
}

export default function FocusTimer({ habit, onFinish, onCancel }: FocusTimerProps) {
  const { enqueue } = useSystemNotification();
  const timed = isTimedSession(habit);
  const targetMinutes =
    timed && habit.goalValue && habit.goalValue > 0
      ? Math.round(habit.goalValue)
      : habit.difficulty === "Easy"
        ? 15
        : habit.difficulty === "Medium"
          ? 30
          : 45;
  const totalSeconds = timed ? targetMinutes * 60 : 0;
  const { label: goalLabel, value: goalValue } = formatGoal(habit);

  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [message, setMessage] = useState(() => {
    const msgs = CATEGORY_MOTIVATIONAL_MESSAGES[habit.category] ?? CATEGORY_MOTIVATIONAL_MESSAGES.Custom;
    return msgs[0];
  });
  const [currentTime, setCurrentTime] = useState(formatCurrentTime());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const clockIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const notifiedRef = useRef(false);
  const lastTickRef = useRef(0);

  const progress = totalSeconds > 0 ? Math.min((elapsed / totalSeconds) * 100, 100) : 0;
  const remaining = Math.max(totalSeconds - elapsed, 0);
  const remainingMin = Math.floor(remaining / 60);
  const remainingSec = remaining % 60;
  const elapsedMin = Math.floor(elapsed / 60);
  const elapsedSec = elapsed % 60;

  const circumference = 2 * Math.PI * 100;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    clockIntervalRef.current = setInterval(() => setCurrentTime(formatCurrentTime()), 1000);
    return () => { if (clockIntervalRef.current) clearInterval(clockIntervalRef.current); };
  }, []);

  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (timed && prev >= totalSeconds) { if (intervalRef.current) clearInterval(intervalRef.current); return totalSeconds; }
          return prev + 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPaused, timed, totalSeconds]);

  useEffect(() => {
    const messages = CATEGORY_MOTIVATIONAL_MESSAGES[habit.category] ?? CATEGORY_MOTIVATIONAL_MESSAGES.Custom;
    messageIntervalRef.current = setInterval(() => setMessage(messages[Math.floor(Math.random() * messages.length)]), 45000);
    return () => { if (messageIntervalRef.current) clearInterval(messageIntervalRef.current); };
  }, [habit.category]);

  useEffect(() => {
    if (timed && elapsed >= totalSeconds && totalSeconds > 0 && !notifiedRef.current) {
      notifiedRef.current = true;
      enqueue({
        type: "MISSION_VERIFIED", title: "Session Complete",
        description: `Great work on "${habit.title}"! You focused for ${targetMinutes} minutes.`,
        icon: ShieldCheck, priority: "high",
        meta: { Duration: `${targetMinutes}m`, Habit: habit.title },
        silent: true,
      });
      playTimerCompleteSound();
      onFinish(targetMinutes);
    }
  }, [timed, elapsed, totalSeconds, targetMinutes, onFinish, habit.title, enqueue]);

  // Stopwatch feel: gentle tick during the final 3 seconds of the countdown.
  useEffect(() => {
    if (!timed || totalSeconds <= 0) return;
    if (remaining > 0 && remaining <= 3 && remaining !== lastTickRef.current) {
      lastTickRef.current = remaining;
      playTimerTick();
    }
  }, [timed, remaining, totalSeconds]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  const handleFinishEarly = () => {
    playTimerCompleteSound();
    onFinish(Math.max(1, elapsedMin));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(15,23,42,0.6)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
      <div ref={containerRef} className={cn("w-full max-w-[720px]", isFullscreen && "max-w-full")}>
        <div
          className="overflow-hidden rounded-3xl border border-white/20 bg-white/95"
          style={{ boxShadow: "0 0 0 1px rgba(37,99,235,0.08), 0 8px 40px rgba(37,99,235,0.12), 0 30px 80px rgba(0,0,0,0.25)" }}
        >
          {/* Header */}
          <div className="px-8 pt-7 pb-5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#2563EB] mb-1">Focus Session</p>
                <h2 className="text-xl font-bold text-[#0F172A]">{habit.title}</h2>
                {habit.activity && habit.activity !== habit.title && (
                  <p className="text-xs text-[#64748B] mt-0.5">{habit.activity}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {habit.category}
                </span>
                <span className="text-xs tabular-nums text-[#94A3B8]">{currentTime}</span>
              </div>
            </div>
          </div>

          <div className="mx-8 h-px bg-slate-100" />

          {/* Body */}
          <div className="px-8 py-8">
            {timed ? (
              /* Circular Timer — centered */
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <svg width="240" height="240" viewBox="0 0 240 240">
                    <circle cx="120" cy="120" r="100" fill="none" stroke="#F1F5F9" strokeWidth="8" />
                    {[...Array(60)].map((_, i) => {
                      const angle = (i * 6 - 90) * (Math.PI / 180);
                      const isHour = i % 5 === 0;
                      const r1 = isHour ? 88 : 92;
                      const r2 = 96;
                      return (
                        <line key={i} x1={120 + r1 * Math.cos(angle)} y1={120 + r1 * Math.sin(angle)} x2={120 + r2 * Math.cos(angle)} y2={120 + r2 * Math.sin(angle)} stroke={isHour ? "#CBD5E1" : "#E2E8F0"} strokeWidth={isHour ? 1.5 : 0.5} />
                      );
                    })}
                    <circle cx="120" cy="120" r="100" fill="none" stroke="#2563EB" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} transform="rotate(-90 120 120)" className="transition-all duration-1000 ease-linear" style={{ filter: "drop-shadow(0 0 6px rgba(37,99,235,0.3))" }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-5xl font-bold tabular-nums tracking-tight text-[#0F172A]">
                      {String(remainingMin).padStart(2, "0")}:{String(remainingSec).padStart(2, "0")}
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#94A3B8] tabular-nums">
                      {elapsedMin}:{String(elapsedSec).padStart(2, "0")} elapsed
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Mission Goal — centered */
              <div className="flex justify-center mb-8">
                <div className="w-full max-w-[420px] rounded-3xl border border-[#2563EB]/10 bg-gradient-to-br from-[#2563EB]/5 to-[#10B981]/5 p-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2563EB]/10">
                    <Target className="h-8 w-8 text-[#2563EB]" />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[#2563EB] mb-1">
                    {goalLabel}
                  </p>
                  <p className="text-5xl font-bold tabular-nums tracking-tight text-[#0F172A]">
                    {goalValue || "—"}
                  </p>
                  <div className="mx-auto mt-5 flex items-center justify-center gap-2 text-xs font-medium text-[#64748B] tabular-nums">
                    <TimerReset className="h-3.5 w-3.5" />
                    {elapsedMin}:{String(elapsedSec).padStart(2, "0")} elapsed
                  </div>
                </div>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center">
                <Clock className="mx-auto mb-2 h-4 w-4 text-[#2563EB]" />
                <p className="text-[10px] font-medium uppercase tracking-wider text-[#94A3B8]">{timed ? "Target" : goalLabel}</p>
                <p className="text-sm font-bold text-[#0F172A] tabular-nums">{timed ? `${targetMinutes} min` : (goalValue || "—")}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center">
                <Zap className="mx-auto mb-2 h-4 w-4 text-[#2563EB]" />
                <p className="text-[10px] font-medium uppercase tracking-wider text-[#94A3B8]">XP Reward</p>
                <p className="text-sm font-bold text-[#2563EB] tabular-nums">{habit.xpReward}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center">
                <Flame className="mx-auto mb-2 h-4 w-4 text-[#F59E0B]" />
                <p className="text-[10px] font-medium uppercase tracking-wider text-[#94A3B8]">Difficulty</p>
                <p className="text-sm font-bold text-[#0F172A]">{habit.difficulty}</p>
              </div>
            </div>

            {/* Motivational quote */}
            <div className="rounded-2xl bg-[#F8FAFC] border border-slate-100 p-4 text-center">
              <p className="text-sm italic text-[#94A3B8] transition-opacity duration-500">&quot;{message}&quot;</p>
            </div>
          </div>

          <div className="mx-8 h-px bg-slate-100" />

          {/* Footer */}
          <div className="px-8 py-6 flex items-center gap-3">
            <button onClick={onCancel} className="h-14 flex-1 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-[#64748B] transition-all duration-200 hover:bg-slate-50">
              Cancel
            </button>
            <button onClick={toggleFullscreen} className="h-14 w-14 flex-shrink-0 flex items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#64748B] transition-all duration-200 hover:bg-slate-50">
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button onClick={() => setIsPaused(!isPaused)} className="h-14 w-14 flex-shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white transition-all duration-200 hover:shadow-lg hover:shadow-[#2563EB]/25">
              {isPaused ? <Play className="h-5 w-5 ml-0.5" /> : <Pause className="h-5 w-5" />}
            </button>
            <button onClick={handleFinishEarly} className="h-14 flex-1 rounded-2xl bg-[#2563EB] text-sm font-semibold text-white transition-all duration-200 hover:bg-[#2563EB] hover:shadow-lg hover:shadow-[#2563EB]/25 flex items-center justify-center gap-2">
              <Flag className="h-4 w-4" />
              {timed ? "Finish" : "Mark Complete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
