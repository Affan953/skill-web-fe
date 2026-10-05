"use client";

import { useState, type FocusEvent, type MouseEvent } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { SidebarNavItem as NavItem } from "@/components/layout/navigationConfig";

interface SidebarNavItemProps {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
  /**
   * Optional count rendered at the trailing edge, e.g. unread messages.
   *
   * Only shown when there is something to say: a `0` pill is noise, and an
   * active dot is then used instead.
   */
  badge?: number;
  onNavigate?: () => void;
}

interface TooltipPosition {
  x: number;
  y: number;
}

export default function SidebarNavItem({
  item,
  collapsed,
  active,
  badge,
  onNavigate,
}: SidebarNavItemProps) {
  const Icon = item.icon;
  const [tooltip, setTooltip] = useState<TooltipPosition | null>(null);
  const tooltipId = `sidebar-tooltip-${item.href.replace(/[^a-zA-Z0-9-]/g, "-")}`;

  const hasBadge = typeof badge === "number" && badge > 0;

  function showTooltip(event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) {
    if (!collapsed) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({ x: rect.right + 12, y: rect.top + rect.height / 2 });
  }

  function hideTooltip() {
    setTooltip(null);
  }

  return (
    <li className="relative">
      <Link
        href={item.href}
        onClick={onNavigate}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        aria-current={active ? "page" : undefined}
        aria-label={collapsed ? item.label : undefined}
        aria-describedby={tooltip ? tooltipId : undefined}
        className={cn(
          "group relative flex h-11 w-full items-center gap-3 rounded-xl text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40",
          collapsed ? "justify-center px-0" : "px-3",
          active
            ? "bg-[#EFF6FF] text-[#2563EB]"
            : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
        )}
      >
        {active && !collapsed && (
          <span
            className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#2563EB]"
            aria-hidden="true"
          />
        )}

        <Icon
          className={cn(
            "h-5 w-5 shrink-0 transition-colors duration-200",
            active && "text-[#2563EB]"
          )}
          aria-hidden="true"
        />

        <span
          style={{ transitionDelay: collapsed ? "0ms" : "190ms" }}
          className={cn(
            "truncate whitespace-nowrap transition-all duration-200",
            collapsed
              ? "max-w-0 opacity-0"
              : "max-w-[180px] opacity-100"
          )}
        >
          {item.label}
        </span>

        {hasBadge && !collapsed ? (
          <span
            data-testid={`nav-badge${item.href.replace(/[^a-zA-Z0-9]/g, "-")}`}
            className="ml-auto inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-[#2563EB] px-1.5 text-[11px] font-semibold tabular-nums text-white"
            aria-label={`${badge} unread ${badge === 1 ? "message" : "messages"}`}
          >
            <span aria-hidden="true">{badge > 99 ? "99+" : badge}</span>
          </span>
        ) : (
          active &&
          !collapsed && (
            <span
              className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]"
              aria-hidden="true"
            />
          )
        )}
      </Link>

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
          {item.label}
        </span>
      )}
    </li>
  );
}
