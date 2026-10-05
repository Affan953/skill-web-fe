"use client";

import Link from "next/link";
import { LogOut, Menu, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserQuery } from "@/hooks/useUserQuery";
import NotificationBadge from "@/components/notifications/NotificationBadge";
import Avatar from "@/components/Avatar";

interface TopNavbarProps {
  onMenuToggle?: () => void;
}

export default function TopNavbar({ onMenuToggle }: TopNavbarProps) {
  const { logout, firebaseUser } = useAuth();
  const { user } = useUserQuery();

  const displayName =
    user?.displayName || user?.username || firebaseUser?.displayName || "Adventurer";
  const displayLevel = user?.level ?? 1;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-sm px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="lg:hidden">
          <span className="text-lg font-semibold text-slate-900">SkillUp RPG</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Messages lives here next to notifications because on mobile the
            sidebar is behind the hamburger, and DMs are a frequent destination.
            No unread badge: the total would need an aggregate count the Phase 32
            endpoints deliberately do not provide, and a wrong number is worse
            than none. Each conversation row shows its own count. */}
        <Link
          href="/messages"
          title="Messages"
          aria-label="Messages"
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
        >
          <MessageSquare className="h-5 w-5" />
        </Link>
        <NotificationBadge />
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-lg p-1 transition-colors hover:bg-slate-100/80 cursor-pointer"
            title="View Profile"
          >
            <Avatar
              name={displayName}
              src={user?.photoUrl}
              size={32}
              alt={displayName}
              priority
              className="h-8 w-8 ring-2 ring-slate-200"
            />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-900">{displayName}</p>
              <p className="text-xs text-slate-500">Level {displayLevel}</p>
            </div>
          </Link>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
