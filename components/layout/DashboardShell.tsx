"use client";

import { useCallback, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import Sidebar from "@/components/layout/Sidebar";
import MobileSidebar from "@/components/layout/MobileSidebar";
import type { SidebarRole } from "@/components/layout/navigationConfig";

interface DashboardShellProps {
  role: SidebarRole;
  topbar: (handlers: { openMobileNav: () => void }) => ReactNode;
  mainClassName?: string;
  children: ReactNode;
}

const STORAGE_KEY = "skillup:sidebar:collapsed";

export default function DashboardShell({
  role,
  topbar,
  mainClassName,
  children,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Persistence is best-effort (e.g. private mode).
      }
      return next;
    });
  }, []);

  const openMobileNav = useCallback(() => setMobileOpen(true), []);
  const closeMobileNav = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar role={role} collapsed={collapsed} onToggle={toggleCollapsed} />

      <MobileSidebar
        role={role}
        open={mobileOpen}
        onClose={closeMobileNav}
      />

      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col transition-[padding] duration-300 ease-out",
          collapsed ? "lg:pl-[72px]" : "lg:pl-64"
        )}
      >
        {topbar({ openMobileNav })}
        <main className={cn("flex-1", mainClassName)}>{children}</main>
      </div>
    </div>
  );
}
