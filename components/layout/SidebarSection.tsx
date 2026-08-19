"use client";

import { cn } from "@/lib/cn";

interface SidebarSectionProps {
  title: string;
  collapsed: boolean;
}

export default function SidebarSection({ title, collapsed }: SidebarSectionProps) {
  return (
    <div
      className={cn(
        "transition-all duration-200",
        collapsed
          ? "mx-4 my-2 border-t border-[#E2E8F0]"
          : "px-4 pb-1.5 pt-5"
      )}
    >
      <span
        style={{ transitionDelay: collapsed ? "0ms" : "210ms" }}
        className={cn(
          "block overflow-hidden whitespace-nowrap text-xs font-medium uppercase tracking-wide text-[#94A3B8] transition-all duration-200",
          collapsed ? "max-h-0 opacity-0" : "max-h-5 opacity-100"
        )}
      >
        {title}
      </span>
    </div>
  );
}
