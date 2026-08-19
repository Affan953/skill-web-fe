"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardShell from "@/components/layout/DashboardShell";
import TopNavbar from "@/components/TopNavbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardShell
        role="user"
        topbar={({ openMobileNav }) => (
          <TopNavbar onMenuToggle={openMobileNav} />
        )}
      >
        {children}
      </DashboardShell>
    </ProtectedRoute>
  );
}
