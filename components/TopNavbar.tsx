"use client";

import Link from "next/link";
import Image from "next/image";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserQuery } from "@/hooks/useUserQuery";
import NotificationBadge from "@/components/notifications/NotificationBadge";

interface TopNavbarProps {
  onMenuToggle?: () => void;
}

export default function TopNavbar({ onMenuToggle }: TopNavbarProps) {
  const { logout, firebaseUser } = useAuth();
  const { user } = useUserQuery();

  const displayName =
    user?.username || firebaseUser?.displayName || "Adventurer";
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
        <NotificationBadge />
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-lg p-1 transition-colors hover:bg-slate-100/80 cursor-pointer"
            title="View Profile"
          >
            {user?.photoUrl ? (
              <Image
                src={user.photoUrl}
                alt={displayName}
                width={32}
                height={32}
                loading="eager"
                priority
                className="h-8 w-8 rounded-full object-cover ring-2 ring-slate-200"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB] text-xs font-semibold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
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
