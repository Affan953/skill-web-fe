"use client";

import { usePathname } from "next/navigation";
import SidebarSection from "@/components/layout/SidebarSection";
import SidebarNavItem from "@/components/layout/SidebarNavItem";
import {
  navigationConfig,
  sidebarSectionOrder,
  type SidebarRole,
  type SidebarNavItem as NavItem,
} from "@/components/layout/navigationConfig";

interface SidebarNavigationProps {
  role: SidebarRole;
  collapsed: boolean;
  onNavigate?: () => void;
}

function isActive(pathname: string, item: NavItem): boolean {
  if (item.href === "/admin") return pathname === "/admin";
  if (item.href === "/dashboard") return pathname === "/dashboard";
  if (pathname === item.href) return true;
  if (item.href.startsWith("/admin/") && pathname.startsWith(item.href)) {
    return true;
  }
  return false;
}

export default function SidebarNavigation({
  role,
  collapsed,
  onNavigate,
}: SidebarNavigationProps) {
  const pathname = usePathname();
  const config = navigationConfig[role];

  return (
    <nav
      className="scrollbar-none flex-1 overflow-y-auto overflow-x-visible px-4 py-2"
      aria-label={role === "admin" ? "Admin navigation" : "Main navigation"}
    >
      <ul className="space-y-1">
        {sidebarSectionOrder.map((key) => {
          const section = config[key];
          if (!section.items.length) return null;

          return (
            <li key={section.title} className="pb-1">
              <SidebarSection title={section.title} collapsed={collapsed} />
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <SidebarNavItem
                    key={item.href}
                    item={item}
                    collapsed={collapsed}
                    active={isActive(pathname, item)}
                    onNavigate={onNavigate}
                  />
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
