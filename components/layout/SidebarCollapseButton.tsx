"use client";

import { useState, type FocusEvent, type MouseEvent } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/cn";

interface SidebarCollapseButtonProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface TooltipPosition {
  x: number;
  y: number;
}

export default function SidebarCollapseButton({
  collapsed,
  onToggle,
}: SidebarCollapseButtonProps) {
  const [tooltip, setTooltip] = useState<TooltipPosition | null>(null);
  const tooltipId = "sidebar-tooltip-collapse";

  function showTooltip(
    event: MouseEvent<HTMLButtonElement> | FocusEvent<HTMLButtonElement>
  ) {
    if (!collapsed) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({ x: rect.right + 12, y: rect.top + rect.height / 2 });
  }

  function hideTooltip() {
    setTooltip(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        aria-describedby={tooltip ? tooltipId : undefined}
        className="group absolute -right-3 top-10 z-10 hidden h-7 w-7 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#64748B] shadow-sm shadow-[#0F172A]/5 transition-all duration-200 hover:border-[#2563EB]/30 hover:bg-[#EFF6FF] hover:text-[#2563EB] hover:shadow-md hover:shadow-[#2563EB]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 lg:flex"
      >
        {collapsed ? (
          <PanelLeftOpen className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
        ) : (
          <PanelLeftClose className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
        )}
      </button>

      {tooltip && (
        <span
          id={tooltipId}
          role="tooltip"
          className={cn(
            "sidebar-tooltip pointer-events-none fixed z-[60] whitespace-nowrap rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#0F172A] shadow-lg shadow-[#0F172A]/10"
          )}
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          Expand sidebar
        </span>
      )}
    </>
  );
}
