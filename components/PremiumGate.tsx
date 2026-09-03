"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/cn";

interface PremiumGateProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

/**
 * Reusable premium gate. For FREE users it renders a clear, non-blocking
 * upgrade prompt with a subtle preview area instead of hiding the whole page.
 * For PREMIUM users it renders the children.
 */
export default function PremiumGate({
  children,
  title = "Premium feature",
  description = "Understand your growth with deeper analytics.",
  className,
}: PremiumGateProps) {
  const { user } = useAuth();
  const isPremium = !!user?.isPremium;

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white",
        className
      )}
    >
      <div className="pointer-events-none opacity-40">
        <div className="p-6 blur-[1px]">{children}</div>
      </div>
      <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-5 text-center">
        <div className="mt-1 mb-3 flex items-center justify-center gap-1.5">
          <Sparkles className="h-4 w-4 text-[#2563EB]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            Premium feature
          </span>
        </div>
        <p className="mx-auto max-w-sm text-sm font-medium text-[#0F172A]">
          {title}
        </p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-[#64748B]">
          {description}
        </p>
        <Link
          href="/upgrade"
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-5 text-sm font-semibold text-white shadow-md shadow-[#2563EB]/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#2563EB]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
        >
          Unlock Premium
        </Link>
      </div>
    </div>
  );
}