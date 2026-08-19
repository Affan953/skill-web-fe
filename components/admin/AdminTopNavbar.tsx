"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, Bell, Search, Calendar } from "lucide-react";
import Image from "next/image";

interface AdminTopNavbarProps {
  onMenuToggle: () => void;
}

export default function AdminTopNavbar({ onMenuToggle }: AdminTopNavbarProps) {
  const { user, firebaseUser } = useAuth();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const displayName = user?.username ?? "Admin";
  const email = firebaseUser?.email ?? user?.email ?? "";
  const photoUrl = user?.photoUrl;

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white/80 backdrop-blur-sm px-4 sm:px-6"
      role="banner"
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="mr-3 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search admin panel..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20"
          aria-label="Search admin panel"
        />
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        {/* Date */}
        <div className="hidden items-center gap-1.5 text-sm text-slate-500 md:flex">
          <Calendar className="h-4 w-4" />
          <span>{today}</span>
        </div>

        {/* Notifications */}
        <button
          className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* Admin Avatar — clickable to profile */}
        <Link
          href="/admin/profile"
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50"
        >
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={displayName}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-[#2563EB]/30"
              unoptimized
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB] text-xs font-semibold text-white">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-900">{displayName}</p>
            <p className="text-[11px] text-slate-400">{email || "Administrator"}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
