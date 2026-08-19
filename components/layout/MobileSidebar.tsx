"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import SidebarLogo from "@/components/layout/SidebarLogo";
import AdminContextCard from "@/components/layout/AdminContextCard";
import SidebarNavigation from "@/components/layout/SidebarNavigation";
import SidebarBottomNav from "@/components/layout/SidebarBottomNav";
import type { SidebarRole } from "@/components/layout/navigationConfig";

interface MobileSidebarProps {
  role: SidebarRole;
  open: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ role, open, onClose }: MobileSidebarProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      // Trap focus inside the drawer while it is open.
      if (event.key === "Tab") {
        const drawer = drawerRef.current;
        if (!drawer) return;

        const focusables = Array.from(
          drawer.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null || el === document.activeElement);

        if (!focusables.length) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === first || !drawer.contains(document.activeElement)) {
            last.focus();
            event.preventDefault();
          }
        } else if (document.activeElement === last || !drawer.contains(document.activeElement)) {
          first.focus();
          event.preventDefault();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop — closes on outside click */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={role === "admin" ? "Admin navigation" : "Main navigation"}
        inert={!open}
        aria-hidden={!open}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-[#E2E8F0] bg-white transition-transform duration-300 ease-out lg:hidden",
          open
            ? "translate-x-0 shadow-2xl shadow-[#0F172A]/15"
            : "-translate-x-full"
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 pb-2 pl-4 pr-3 pt-4">
          <SidebarLogo
            roleLabel={role === "admin" ? "Management" : "Growth Platform"}
            href={role === "admin" ? "/admin" : "/dashboard"}
          />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#64748B] transition-colors hover:bg-slate-50 hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {role === "admin" && (
          <div className="shrink-0 px-4 pb-3">
            <AdminContextCard collapsed={false} />
          </div>
        )}

        <SidebarNavigation role={role} collapsed={false} onNavigate={onClose} />

        <SidebarBottomNav collapsed={false} />
      </aside>
    </>
  );
}
