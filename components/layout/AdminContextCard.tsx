"use client";

import { ShieldCheck, Command } from "lucide-react";
import { cn } from "@/lib/cn";

interface AdminContextCardProps {
  collapsed: boolean;
}

export default function AdminContextCard({ collapsed }: AdminContextCardProps) {
  const unfoldDelay = collapsed ? "0ms" : "90ms";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_2px_10px_rgba(37,99,235,0.06)] transition-all duration-300",
        collapsed ? "h-12 w-12" : "h-[132px]"
      )}
      aria-label={collapsed ? undefined : "Admin management center"}
    >
      {/* Expanded admin card */}
      <div
        inert={collapsed}
        style={{ transitionDelay: unfoldDelay }}
        className={cn(
          "absolute inset-0 flex flex-col p-4 transition-all duration-300",
          collapsed ? "scale-95 opacity-0" : "scale-100 opacity-100"
        )}
        aria-hidden={collapsed}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] shadow-sm shadow-[#2563EB]/25">
            <ShieldCheck className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#0F172A]">
              SkillUp Admin
            </p>
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#64748B]">
              Administrator
            </p>
          </div>
        </div>

        <div className="mt-auto border-t border-[#F1F5F9] pt-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#64748B]">
            <Command className="h-3 w-3 text-[#2563EB]" aria-hidden="true" />
            Management Center
          </div>
        </div>
      </div>

      {/* Compact admin badge */}
      <div
        inert={!collapsed}
        style={{ transitionDelay: unfoldDelay }}
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center gap-1 transition-all duration-300",
          collapsed ? "scale-100 opacity-100" : "scale-90 opacity-0"
        )}
        aria-hidden={!collapsed}
        role="img"
        aria-label="Admin management center"
        title="SkillUp Admin — Management Center"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] shadow-sm shadow-[#2563EB]/25">
          <ShieldCheck className="h-4 w-4 text-white" aria-hidden="true" />
        </div>
        <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#2563EB]">
          Admin
        </span>
      </div>
    </div>
  );
}
