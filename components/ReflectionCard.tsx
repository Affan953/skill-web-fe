"use client";

import { BookOpen, Zap, Flame, Star, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Reflection } from "@/types";

const CATEGORY_COLORS: Record<string, string> = {
  Learning: "bg-[#2563EB]/10 text-[#2563EB]",
  Fitness: "bg-[#10B981]/10 text-[#10B981]",
  Reading: "bg-[#2563EB]/10 text-[#2563EB]",
  Meditation: "bg-[#10B981]/10 text-[#10B981]",
  Coding: "bg-[#2563EB]/10 text-[#2563EB]",
  Health: "bg-[#10B981]/10 text-[#10B981]",
  Productivity: "bg-[#2563EB]/10 text-[#2563EB]",
  Finance: "bg-[#10B981]/10 text-[#10B981]",
  Language: "bg-[#2563EB]/10 text-[#2563EB]",
  Custom: "bg-slate-100 text-slate-500",
};

interface ReflectionCardProps {
  reflection: Reflection;
}

export default function ReflectionCard({ reflection }: ReflectionCardProps) {
  const createdAt =
    typeof reflection.createdAt === "string"
      ? new Date(reflection.createdAt)
      : new Date(reflection.createdAt);

  const timeAgo = getTimeAgo(createdAt);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB]/10">
            <BookOpen className="h-5 w-5 text-[#2563EB]" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              {reflection.title}
            </h4>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium",
                  CATEGORY_COLORS[reflection.category] ?? "bg-slate-100 text-slate-500"
                )}
              >
                {reflection.category}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="h-3 w-3" />
                {timeAgo}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="flex items-center gap-1 text-xs font-semibold text-[#10B981]">
            <Zap className="h-3 w-3" />+{reflection.xpEarned} XP
          </span>
        </div>
      </div>

      <p className="mb-3 text-sm text-slate-600 leading-relaxed">
        {reflection.reflection}
      </p>

      {reflection.proofOfProgress && Object.keys(reflection.proofOfProgress).length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {Object.entries(reflection.proofOfProgress).map(([key, value]) => (
            <span
              key={key}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-500"
            >
              {key}: {String(value)}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 border-t border-slate-100 pt-3">
        <span className="flex items-center gap-1 text-[11px] text-slate-400">
          <Flame className="h-3 w-3" />
          Streak: {reflection.streakAfter}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-slate-400">
          <Star className="h-3 w-3" />
          Level: {reflection.levelAfter}
        </span>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
