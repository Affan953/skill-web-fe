"use client";

import { usePathname } from "next/navigation";
import SidebarSection from "@/components/layout/SidebarSection";
import SidebarNavItem from "@/components/layout/SidebarNavItem";
import { useInboxUnreadCount } from "@/hooks/useConversations";
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

/**
 * A section item is active on its own route and on anything nested under it, so
 * "Messages" stays lit while a conversation is open — the same rule the admin
 * config already relied on.
 */
function isActive(pathname: string, item: NavItem): boolean {
  if (item.href === "/admin") return pathname === "/admin";
  if (item.href === "/dashboard") return pathname === "/dashboard";
  if (pathname === item.href) return true;
  if (pathname.startsWith(`${item.href}/`)) {
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

  /**
   * The unread badge reads the conversation cache the messages pages already
   * populate, so the number costs no request of its own — and it is only
   * subscribed on a messages route, where that cache is being refreshed anyway.
   * Elsewhere the item shows no count rather than one that quietly went stale.
   */
  const unreadMessages = useInboxUnreadCount({
    enabled: role === "user" && (pathname?.startsWith("/messages") ?? false),
  });

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
                    badge={
                      role === "user" && item.href === "/messages"
                        ? unreadMessages
                        : undefined
                    }
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
