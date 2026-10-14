"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardShell from "@/components/layout/DashboardShell";
import TopNavbar from "@/components/TopNavbar";
import { AiContextProvider } from "@/contexts/AiContext";
import { AiAssistant } from "@/components/ai/AiAssistant";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AiContextProvider>
        <DashboardShell
          role="user"
          topbar={({ openMobileNav }) => (
            <TopNavbar onMenuToggle={openMobileNav} />
          )}
        >
          {children}
        </DashboardShell>
        <AiAssistant />
      </AiContextProvider>
    </ProtectedRoute>
  );
}
