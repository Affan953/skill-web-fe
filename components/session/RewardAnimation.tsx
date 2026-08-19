"use client";

import { useState, useEffect } from "react";
import { Zap, Star, Flame, Trophy, BookOpen, CheckCircle2, Bell } from "lucide-react";
import { cn } from "@/lib/cn";

interface RewardStep {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  bgColor: string;
  delay: number;
}

const REWARD_STEPS: RewardStep[] = [
  { icon: BookOpen, label: "Journey Recorded", color: "text-[#2563EB]", bgColor: "bg-[#2563EB]", delay: 0 },
  { icon: Zap, label: "XP Earned", color: "text-[#10B981]", bgColor: "bg-[#10B981]", delay: 400 },
  { icon: Star, label: "Level Progress", color: "text-[#2563EB]", bgColor: "bg-[#2563EB]", delay: 800 },
  { icon: Flame, label: "Streak Active", color: "text-orange-500", bgColor: "bg-orange-500", delay: 1200 },
  { icon: Trophy, label: "Achievement Check", color: "text-amber-500", bgColor: "bg-amber-500", delay: 1600 },
  { icon: Bell, label: "Notification Sent", color: "text-purple-500", bgColor: "bg-purple-500", delay: 2000 },
  { icon: CheckCircle2, label: "Growth Journal Updated", color: "text-[#10B981]", bgColor: "bg-[#10B981]", delay: 2400 },
];

interface RewardAnimationProps {
  xpEarned: number;
  onComplete: () => void;
}

export default function RewardAnimation({ xpEarned, onComplete }: RewardAnimationProps) {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const [showXp, setShowXp] = useState(false);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    REWARD_STEPS.forEach((step, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleSteps((prev) => [...prev, i]);
          if (step.label === "XP Earned") {
            setTimeout(() => setShowXp(true), 200);
          }
        }, step.delay)
      );
    });

    timers.push(setTimeout(onComplete, 3500));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          {showXp && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#10B981]/10 px-4 py-2">
              <Zap className="h-5 w-5 text-[#10B981]" />
              <span className="text-lg font-bold text-[#10B981] animate-pulse">+{xpEarned} XP</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {REWARD_STEPS.map((step, i) => {
            const Icon = step.icon;
            const isVisible = visibleSteps.includes(i);
            return (
              <div key={i}
                className={cn(
                  "flex items-center gap-3 rounded-xl p-3 transition-all duration-500",
                  isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                )}>
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-white transition-all duration-300",
                  isVisible ? "scale-100" : "scale-0", step.bgColor)}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-slate-700">{step.label}</span>
                {isVisible && (
                  <CheckCircle2 className="ml-auto h-4 w-4 text-[#10B981] animate-[scale-in_0.3s_ease-out]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
