"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/cn";
import { X } from "lucide-react";

interface SystemWindowProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
}

export default function SystemWindow({
  open,
  onClose,
  title,
  subtitle,
  children,
  className,
  maxWidth = "max-w-lg",
}: SystemWindowProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => {
        setMounted(true);
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(raf);
    }
    const hide = setTimeout(() => setVisible(false), 0);
    const unmount = setTimeout(() => setMounted(false), 300);
    return () => {
      clearTimeout(hide);
      clearTimeout(unmount);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div
      ref={overlayRef}
      className={cn(
        "fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300",
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      role="dialog"
      aria-modal="true"
      aria-label={title || "System Window"}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Window */}
      <div
        className={cn(
          "relative flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-2xl border transition-all duration-300",
          maxWidth,
          visible
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4",
          className
        )}
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.65) 100%)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          boxShadow:
            "0 0 0 1px rgba(37,99,235,0.15), 0 0 30px rgba(37,99,235,0.08), 0 20px 60px rgba(0,0,0,0.15)",
          borderColor: "rgba(37,99,235,0.2)",
        }}
      >
        {/* Blue glow top accent */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2563EB]/40 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#2563EB]/5 to-transparent pointer-events-none" />

        {/* Scan line animation */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[#2563EB]/10 to-transparent"
            style={{
              animation: "scanline 3s linear infinite",
            }}
          />
        </div>

        {/* Header */}
        {(title || subtitle) && (
          <div className="relative flex items-center justify-between border-b border-slate-200/60 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400/80" />
                <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                <div className="h-3 w-3 rounded-full bg-green-400/80" />
              </div>
              <div>
                {title && (
                  <h3 className="text-sm font-semibold text-slate-900">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-[11px] text-slate-500">{subtitle}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="scrollbar-none relative min-h-0 flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Scan line keyframes injected */}
        <style jsx global>{`
          @keyframes scanline {
            0% { top: -2px; }
            100% { top: 100%; }
          }
        `}</style>
      </div>
    </div>
  );
}
