"use client";

import { useState, type FocusEvent, type MouseEvent } from "react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarBottomNavProps {
  collapsed: boolean;
}

interface TooltipPosition {
  x: number;
  y: number;
}

export default function SidebarBottomNav({ collapsed }: SidebarBottomNavProps) {
  const { logout } = useAuth();
  const [tooltip, setTooltip] = useState<TooltipPosition | null>(null);
  const tooltipId = "sidebar-tooltip-logout";

  function showTooltip(event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) {
    if (!collapsed) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({ x: rect.right + 12, y: rect.top + rect.height / 2 });
  }

  function hideTooltip() {
    setTooltip(null);
  }

  return (
    <div className="border-t border-[#E2E8F0] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <button
        type="button"
        onClick={() => void logout()}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        aria-label={collapsed ? "Logout" : undefined}
        aria-describedby={tooltip ? tooltipId : undefined}
        className={cn(
          "group relative flex h-11 w-full items-center gap-3 rounded-xl text-sm font-medium text-[#64748B] transition-colors duration-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40",
          collapsed ? "justify-center px-0" : "px-3"
        )}
      >
        <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span
          style={{ transitionDelay: collapsed ? "0ms" : "80ms" }}
          className={cn(
            "truncate whitespace-nowrap transition-all duration-200",
            collapsed
              ? "max-w-0 opacity-0"
              : "max-w-[180px] opacity-100"
          )}
        >
          Logout
        </span>
      </button>

      {tooltip && (
        <span
          id={tooltipId}
          role="tooltip"
          className={cn(
            "sidebar-tooltip pointer-events-none fixed z-[60] whitespace-nowrap rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#0F172A] shadow-lg shadow-[#0F172A]/10",
            collapsed ? "" : "hidden"
          )}
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          Logout
        </span>
      )}
    </div>
  );
}
