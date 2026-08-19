"use client";

import { cn } from "@/lib/cn";
import SidebarLogo from "@/components/layout/SidebarLogo";
import AdminContextCard from "@/components/layout/AdminContextCard";
import SidebarNavigation from "@/components/layout/SidebarNavigation";
import SidebarBottomNav from "@/components/layout/SidebarBottomNav";
import SidebarCollapseButton from "@/components/layout/SidebarCollapseButton";
import type { SidebarRole } from "@/components/layout/navigationConfig";

interface SidebarProps {
  role: SidebarRole;
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ role, collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden border-r border-[#E2E8F0] bg-[#F8FAFC] transition-[width] duration-300 ease-out lg:flex lg:flex-col",
        collapsed ? "lg:w-[72px]" : "lg:w-64"
      )}
      aria-label={role === "admin" ? "Admin sidebar" : "Sidebar"}
    >
      <div className="flex h-full flex-col">
        <div
          className={cn(
            "shrink-0 px-4 transition-all duration-300",
            collapsed ? "pb-3 pt-4" : "pb-3 pt-6"
          )}
        >
          <SidebarLogo
            collapsed={collapsed}
            roleLabel={role === "admin" ? "Growth Management" : "Level Up Your Real Life"}
            href={role === "admin" ? "/admin" : "/dashboard"}
          />
        </div>

        {role === "admin" && (
          <div className="shrink-0 px-4 pb-3">
            <AdminContextCard collapsed={collapsed} />
          </div>
        )}

        <SidebarNavigation role={role} collapsed={collapsed} />

        <SidebarBottomNav collapsed={collapsed} />
      </div>

      <SidebarCollapseButton collapsed={collapsed} onToggle={onToggle} />
    </aside>
  );
}
