import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CheckSquare,
  NotebookPen,
  Award,
  CalendarCheck,
  BarChart3,
  Trophy,
  BookOpen,
  Bell,
  User,
  Settings,
  Users,
  BookOpenCheck,
  Target,
  Crown,
  Sparkles,
  CreditCard,
  ShieldCheck,
} from "lucide-react";

export type SidebarRole = "user" | "admin";

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface SidebarNavSection {
  title: string;
  items: SidebarNavItem[];
}

export interface RoleNavigationConfig {
  main: SidebarNavSection;
  insights: SidebarNavSection;
  account: SidebarNavSection;
}

/**
 * Configuration-driven sidebar navigation.
 * The sidebar never hardcodes role checks — it only selects a config by role.
 */
export const navigationConfig: Record<SidebarRole, RoleNavigationConfig> = {
  user: {
    main: {
      title: "Main",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Habits", href: "/habits", icon: CheckSquare },
        { label: "Growth Journal", href: "/growth-journal", icon: NotebookPen },
        { label: "Achievements", href: "/achievements", icon: Award },
        { label: "Daily Quests", href: "/daily-quests", icon: CalendarCheck },
      ],
    },
    insights: {
      title: "Insights",
      items: [
        { label: "Statistics", href: "/statistics", icon: BarChart3 },
        { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
        { label: "Reviews", href: "/reviews", icon: BookOpen },
      ],
    },
    account: {
      title: "Account",
      items: [
        { label: "Upgrade", href: "/upgrade", icon: Sparkles },
        { label: "Notifications", href: "/notifications", icon: Bell },
        { label: "Profile", href: "/profile", icon: User },
        { label: "Settings", href: "/settings", icon: Settings },
      ],
    },
  },
  admin: {
    main: {
      title: "Main",
      items: [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { label: "Users", href: "/admin/users", icon: Users },
        { label: "Payments", href: "/admin/payments", icon: CreditCard },
        {
          label: "Subscriptions",
          href: "/admin/subscriptions",
          icon: ShieldCheck,
        },
        { label: "Habits", href: "/admin/habits", icon: CheckSquare },
        { label: "Reflections", href: "/admin/reflections", icon: BookOpenCheck },
        { label: "Achievements", href: "/admin/achievements", icon: Trophy },
        { label: "Daily Quests", href: "/admin/daily-quests", icon: Target },
        { label: "Notifications", href: "/admin/notifications", icon: Bell },
      ],
    },
    insights: {
      title: "Insights",
      items: [
        { label: "Statistics", href: "/admin/statistics", icon: BarChart3 },
        { label: "Leaderboard", href: "/admin/leaderboard", icon: Crown },
      ],
    },
    account: {
      title: "Account",
      items: [
        { label: "Profile", href: "/admin/profile", icon: User },
        { label: "Settings", href: "/admin/settings", icon: Settings },
      ],
    },
  },
};

export const sidebarSectionOrder = [
  "main",
  "insights",
  "account",
] as const;
