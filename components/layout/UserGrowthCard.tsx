"use client";

import { Flame, Zap } from "lucide-react";
import { cn } from "@/lib/cn";
import { useUserQuery } from "@/hooks/useUserQuery";
import { levelPercent } from "@/lib/xp";

interface UserGrowthCardProps {
  collapsed: boolean;
}

function GrowthRing({ percent }: { percent: number }) {
  const radius = 17;
  const stroke = 3.5;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const dashOffset = circumference - (percent / 100) * circumference;

  return (
    <svg
      height={radius * 2}
      width={radius * 2}
      viewBox={`0 0 ${radius * 2} ${radius * 2}`}
      className="-rotate-90"
      aria-hidden="true"
    >
      <circle
        stroke="#E2E8F0"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke="#2563EB"
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={dashOffset}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
    </svg>
  );
}

export default function UserGrowthCard({ collapsed }: UserGrowthCardProps) {
  const { user } = useUserQuery();

  const name = user?.username || "Adventurer";
  const level = user?.level ?? 1;
  const xp = user?.xp ?? 0;
  const streak = user?.currentStreak ?? 0;

  // Display-only level progress (mirrors the dashboard's XP bar).
  const xpPercent = levelPercent(level, xp);

  const unfoldDelay = collapsed ? "0ms" : "90ms";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_2px_10px_rgba(37,99,235,0.06)] transition-all duration-300",
        collapsed ? "h-12 w-12" : "h-[176px]"
      )}
      aria-label={collapsed ? undefined : "Growth progress"}
    >
      {/* Expanded growth card */}
      <div
        inert={collapsed}
        style={{ transitionDelay: unfoldDelay }}
        className={cn(
          "absolute inset-0 flex flex-col p-4 transition-all duration-300",
          collapsed ? "scale-95 opacity-0" : "scale-100 opacity-100"
        )}
        aria-hidden={collapsed}
      >
        {/* Identity — name is secondary to growth */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-[13px] font-bold text-white">
            {name.charAt(0).toUpperCase()}
          </div>
          <p className="truncate text-[13px] font-semibold text-[#0F172A]">
            {name}
          </p>
        </div>

        {/* Level — the hero of the card */}
        <div className="mt-3.5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                Level
              </p>
              <p className="text-[26px] font-bold leading-7 tracking-tight text-[#0F172A]">
                {level}
              </p>
            </div>
            <p className="pb-1 text-xs font-bold text-[#2563EB]">
              {xpPercent}%
            </p>
          </div>

          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-[#E8EEF5]"
            role="progressbar"
            aria-valuenow={xpPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="XP progress toward next level"
          >
            <div
              className="h-full rounded-full bg-[#2563EB] transition-all duration-700 ease-out"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* XP + streak */}
        <div className="mt-auto flex items-center justify-between border-t border-[#F1F5F9] pt-3">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0F172A]">
            <Zap className="h-3.5 w-3.5 text-[#10B981]" aria-hidden="true" />
            {xp.toLocaleString()} XP
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0F172A]">
            <Flame className="h-3.5 w-3.5 text-[#F97316]" aria-hidden="true" />
            {streak} day{streak === 1 ? "" : "s"} streak
          </span>
        </div>
      </div>

      {/* Compact growth ring */}
      <div
        inert={!collapsed}
        style={{ transitionDelay: unfoldDelay }}
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-300",
          collapsed ? "scale-100 opacity-100" : "scale-90 opacity-0"
        )}
        aria-hidden={!collapsed}
        role="img"
        aria-label="Growth progress"
        title={`Level ${level} · ${xpPercent}%`}
      >
        <div className="relative flex items-center justify-center">
          <GrowthRing percent={xpPercent} />
          <span className="absolute text-[9px] font-bold text-[#2563EB]">
            {xpPercent}%
          </span>
        </div>
      </div>
    </div>
  );
}
