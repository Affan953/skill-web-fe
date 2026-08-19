"use client";

import AdminRoute from "@/components/AdminRoute";
import DashboardShell from "@/components/layout/DashboardShell";
import AdminTopNavbar from "@/components/admin/AdminTopNavbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRoute>
      <DashboardShell
        role="admin"
        mainClassName="px-4 py-6 sm:px-6 sm:py-8"
        topbar={({ openMobileNav }) => (
          <AdminTopNavbar onMenuToggle={openMobileNav} />
        )}
      >
        {children}
      </DashboardShell>
    </AdminRoute>
  );
}
