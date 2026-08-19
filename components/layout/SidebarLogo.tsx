"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

interface SidebarLogoProps {
  collapsed?: boolean;
  roleLabel?: string;
  href?: string;
}

export default function SidebarLogo({
  collapsed = false,
  roleLabel = "Level Up Your Real Life",
  href = "/dashboard",
}: SidebarLogoProps) {
  const textDelay = collapsed ? "0ms" : "40ms";

  return (
    <Link
      href={href}
      className={cn(
        "group flex shrink-0 items-center rounded-2xl transition-colors duration-200 hover:bg-[#F1F5F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8FAFC]",
        collapsed ? "justify-center px-1 py-1" : "gap-3 px-2.5 py-1.5"
      )}
      aria-label="SkillUp home"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] shadow-md shadow-[#2563EB]/25 transition-transform duration-200 group-hover:scale-[1.04]">
        <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
      </div>

      <span
        style={{ transitionDelay: textDelay }}
        className={cn(
          "overflow-hidden whitespace-nowrap transition-all duration-200",
          collapsed ? "max-w-0 opacity-0" : "max-w-48 opacity-100"
        )}
      >
        <span className="block text-[15px] font-bold leading-tight tracking-tight text-[#0F172A]">
          SkillUp
        </span>
        <span className="block truncate text-[11px] font-medium leading-tight text-[#64748B]">
          {roleLabel}
        </span>
      </span>
    </Link>
  );
}
