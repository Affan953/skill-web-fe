"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  Check,
  ChevronRight,
  TrendingUp,
  BarChart3,
  FileText,
  Award,
  Loader2,
  Lock,
  X,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { useUserQuery } from "@/hooks/useUserQuery";
import { paymentsApi } from "@/lib/api";
import { loadMidtransSnap } from "@/lib/midtransSnap";
import { formatIDR, formatDate } from "@/lib/format";
import type { CreatePaymentResult, PaymentStatusResult } from "@/types";

const PLAN_PRICE = 29000;
const PLAN_DAYS = 30;

type PaymentState =
  | "idle"
  | "loading"
  | "pending"
  | "success"
  | "failed"
  | "expired"
  | "cancelled";

const BENEFITS = [
  {
    icon: BarChart3,
    title: "Advanced Statistics",
    description:
      "Understand patterns in your habits with deeper, real-data analytics.",
  },
  {
    icon: TrendingUp,
    title: "Growth Analytics",
    description: "See how your consistency evolves week over week.",
  },
  {
    icon: FileText,
    title: "Personal Reports",
    description: "Turn your progress into meaningful, personal insights.",
  },
  {
    icon: Award,
    title: "Achievement Insights",
    description: "Understand what you've truly accomplished.",
  },
];

const FAQS = [
  {
    q: "What do I get with Premium?",
    a: "Deeper analytics and personal insights that help you understand your growth — advanced statistics, growth analytics, personal progress reports, achievement insights and more. Free features stay exactly as they are.",
  },
  {
    q: "How is Premium billed?",
    a: "A single payment unlocks 30 days of Premium. There is no automatic renewal — you'll never be charged again unless you choose to upgrade again.",
  },
  {
    q: "Is my payment secure?",
    a: "Yes. Payments are processed by Midtrans, a trusted payment gateway. Your payment details never reach SkillUp servers.",
  },
  {
    q: "What if I already have Premium?",
    a: "Purchasing again extends your current Premium by 30 days, so you never lose remaining time.",
  },
];

export default function UpgradePage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { getToken } = useFirebaseToken();
  const { invalidateUser } = useUserQuery();

  const isPremium = !!user?.isPremium;

  const [session, setSession] = useState<CreatePaymentResult | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [error, setError] = useState("");
  const [verifiedStatus, setVerifiedStatus] =
    useState<PaymentStatusResult | null>(null);
  const [premiumActivated, setPremiumActivated] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const cleanupPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => cleanupPoll(), []);

  useEffect(() => {
    if (premiumActivated) {
      void refreshUser();
      void invalidateUser();
    }
  }, [premiumActivated, refreshUser, invalidateUser]);

  const startCheckout = async () => {
    const token = await getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    setPaymentState("loading");
    setError("");
    try {
      const res = await paymentsApi.create(token, "PREMIUM");
      setSession(res);
      setPaymentState("pending");
      // Load Snap, then open the popup with the token.
      try {
        const isProd =
          typeof window !== "undefined" &&
          window.location.hostname !== "localhost" &&
          !window.location.hostname.endsWith(".local");
        await loadMidtransSnap(res.clientKey, isProd);
      } catch {
        // Snap failed to load — we can still poll server status.
      }
      await new Promise<void>((done) => setTimeout(done, 80));

      if (typeof window !== "undefined" && window.snap) {
        window.snap.pay(res.token, {
          onSuccess: () => {
            setPaymentState("success");
            void verifyStatus(res.orderId);
          },
          onPending: () => {
            setPaymentState("pending");
          },
          onError: () => {
            setPaymentState("failed");
            setError(
              "Payment couldn't be completed. You can try again anytime."
            );
          },
          onClose: () => {
            setPaymentState("cancelled");
          },
        });
      } else {
        // Snap widget unavailable — fall back to polling server-side status.
        startPolling(res.orderId);
      }
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : "We couldn't start your checkout right now. Please try again.";
      setPaymentState("failed");
      setError(msg);
    }
  };

  const verifyStatus = async (orderId: string) => {
    const token = await getToken();
    if (!token) return;
    try {
      const status = await paymentsApi.getStatus(token, orderId);
      setVerifiedStatus(status);
      if (status.status === "PAID") {
        setPaymentState("success");
        setPremiumActivated(true);
        void refreshUser();
        void invalidateUser();
        cleanupPoll();
      } else if (status.status === "FAILED") {
        setPaymentState("failed");
        cleanupPoll();
      } else if (status.status === "EXPIRED") {
        setPaymentState("expired");
        cleanupPoll();
      } else if (status.status === "CANCELLED") {
        setPaymentState("cancelled");
        cleanupPoll();
      } else {
        // PENDING — keep polling server-side (don't trust the client callback).
        startPolling(orderId);
      }
    } catch {
      // ignore transient errors; polling continues
    }
  };

  const startPolling = (orderId: string) => {
    cleanupPoll();
    pollRef.current = setInterval(() => {
      void verifyStatus(orderId);
    }, 5000);
  };

  const resetCheckout = () => {
    cleanupPoll();
    setSession(null);
    setPaymentState("idle");
    setError("");
    setVerifiedStatus(null);
  };

  const expiredDate = isPremium ? user?.premiumExpiresAt : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Hero */}
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2563EB]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#2563EB]">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            SkillUp Premium
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight text-[#0F172A] sm:text-5xl">
            Go beyond tracking.
            <br />
            <span className="text-[#2563EB]">Understand your growth.</span>
          </h1>
          <p className="mt-4 max-w-md text-base text-[#64748B]">
            Unlock deeper insights into your habits, progress, and personal
            growth.
          </p>

          {isPremium ? (
            <div className="mt-6 flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 rounded-xl border border-[#10B981]/30 bg-[#10B981]/5 px-4 py-3 text-sm font-semibold text-[#0F172A]">
                <Check className="h-4 w-4 text-[#10B981]" aria-hidden="true" />
                You&apos;re Premium. Active until{" "}
                {expiredDate ? formatDate(expiredDate) : "your plan end date"}.
              </div>
              <Link
                href="/statistics"
                className="inline-flex h-12 w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-6 text-sm font-semibold text-white shadow-md shadow-[#2563EB]/20 transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
              >
                Explore Premium
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => router.push("/upgrade#checkout")}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-6 text-sm font-semibold text-white shadow-md shadow-[#2563EB]/20 transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
              >
                Unlock Premium
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="inline-flex h-12 items-center justify-center px-5 text-sm font-medium text-[#64748B] transition-colors hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 rounded-xl"
              >
                Maybe later
              </button>
            </div>
          )}
        </div>

        {/* Visual / growth illustration — minimal editorial card */}
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 shadow-[0_8px_40px_rgba(37,99,235,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#94A3B8]">
            Your growth at a glance
          </p>
          <div className="mt-6 space-y-4">
            <div className="flex items-end gap-1">
              {[40, 62, 48, 78, 66, 90, 84].map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className="w-full rounded-t-md bg-gradient-to-t from-[#2563EB]/80 to-[#60A5FA]"
                  aria-hidden="true"
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-[#94A3B8]">
              <span>3 weeks ago</span>
              <span className="font-medium text-[#2563EB]">Now</span>
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-[#2563EB]/10 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0F172A]">
              <TrendingUp className="h-4 w-4 text-[#10B981]" aria-hidden="true" />
              Consistency improved
            </div>
            <p className="mt-1 text-xs text-[#64748B]">
              Deeper insights appear as you build momentum.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mt-20">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#2563EB]">
          What you unlock
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[#0F172A]">
          Deeper understanding, not just more features
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(37,99,235,0.08)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB]/10">
                <b.icon className="h-5 w-5 text-[#2563EB]" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[#0F172A]">
                {b.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#64748B]">
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Editorial statement */}
      <section className="mt-20 rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 text-center sm:p-12">
        <h2 className="mx-auto max-w-2xl text-2xl font-bold text-[#0F172A] sm:text-3xl">
          Your growth deserves more than a checklist.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-[#64748B]">
          Premium helps you see the why behind the what — turning your daily
          wins into a clear picture of progress.
        </p>
      </section>

      {/* Checkout */}
      <section id="checkout" className="mt-20">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_8px_40px_rgba(37,99,235,0.06)]">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#2563EB]">
              Pricing
            </p>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-4xl font-bold text-[#0F172A]">
                  {formatIDR(PLAN_PRICE)}
                </div>
                <p className="mt-1 text-sm text-[#64748B]">
                  {PLAN_DAYS} days · No automatic renewal
                </p>
              </div>
              <span className="rounded-full bg-[#10B981]/10 px-3 py-1 text-xs font-semibold text-[#10B981]">
                30-day Premium
              </span>
            </div>

            {/* Payment states */}
            {paymentState === "success" || premiumActivated ? (
              <>
                <style>{`
                  @keyframes confetti-fall {
                    0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(120px) rotate(720deg); opacity: 0; }
                  }
                  @keyframes pop-in {
                    0% { transform: scale(0); opacity: 0; }
                    60% { transform: scale(1.2); }
                    100% { transform: scale(1); opacity: 1; }
                  }
                  @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                  }
                  @keyframes slide-up {
                    0% { transform: translateY(16px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                  }
                  @keyframes sparkle-pulse {
                    0%, 100% { opacity: 0.3; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.2); }
                  }
                  .confetti-piece {
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    border-radius: 2px;
                    animation: confetti-fall 1.8s ease-out forwards;
                    pointer-events: none;
                  }
                `}</style>
                <div className="relative mt-6 overflow-hidden rounded-3xl border border-[#10B981]/20 bg-gradient-to-b from-[#10B981]/[0.07] via-white to-white p-8 text-center">
                  {/* Confetti particles */}
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    {[
                      { left: "10%", color: "#2563EB", delay: "0s" },
                      { left: "25%", color: "#10B981", delay: "0.1s" },
                      { left: "40%", color: "#F59E0B", delay: "0.2s" },
                      { left: "55%", color: "#EC4899", delay: "0.05s" },
                      { left: "70%", color: "#8B5CF6", delay: "0.15s" },
                      { left: "85%", color: "#06B6D4", delay: "0.25s" },
                      { left: "15%", color: "#F97316", delay: "0.3s" },
                      { left: "50%", color: "#10B981", delay: "0.12s" },
                      { left: "75%", color: "#2563EB", delay: "0.18s" },
                      { left: "35%", color: "#EC4899", delay: "0.22s" },
                      { left: "60%", color: "#F59E0B", delay: "0.08s" },
                      { left: "90%", color: "#8B5CF6", delay: "0.28s" },
                    ].map((c, i) => (
                      <div
                        key={i}
                        className="confetti-piece"
                        style={{
                          left: c.left,
                          top: "-10px",
                          backgroundColor: c.color,
                          animationDelay: c.delay,
                        }}
                      />
                    ))}
                  </div>

                  {/* Animated checkmark with glow */}
                  <div
                    className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] shadow-[0_0_40px_rgba(16,185,129,0.35)]"
                    style={{ animation: "pop-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
                  >
                    <svg
                      className="h-10 w-10 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>

                  {/* Title with shimmer */}
                  <h3
                    className="mt-5 bg-gradient-to-r from-[#10B981] via-[#059669] to-[#10B981] bg-clip-text text-2xl font-bold text-transparent"
                    style={{
                      backgroundSize: "200% auto",
                      animation: "shimmer 3s linear infinite, slide-up 0.5s ease-out 0.3s both",
                    }}
                  >
                    Welcome to Premium!
                  </h3>
                  <p
                    className="mt-2 text-sm text-[#64748B]"
                    style={{ animation: "slide-up 0.5s ease-out 0.4s both" }}
                  >
                    Your SkillUp experience has been upgraded.
                  </p>

                  {/* Expiry date */}
                  <div
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#10B981]/10 px-4 py-2 text-sm font-semibold text-[#10B981]"
                    style={{ animation: "slide-up 0.5s ease-out 0.5s both" }}
                  >
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Premium active until{" "}
                    {user?.premiumExpiresAt
                      ? formatDate(user.premiumExpiresAt)
                      : formatDate(verifiedStatus?.processedAt ?? undefined)}
                  </div>

                  {/* Unlocked benefits */}
                  <div
                    className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3 text-left"
                    style={{ animation: "slide-up 0.5s ease-out 0.6s both" }}
                  >
                    {[
                      { icon: BarChart3, label: "Advanced Statistics" },
                      { icon: TrendingUp, label: "Growth Analytics" },
                      { icon: FileText, label: "Personal Reports" },
                      { icon: Award, label: "Achievement Insights" },
                    ].map((b, i) => (
                      <div
                        key={b.label}
                        className="flex items-center gap-2.5 rounded-xl border border-[#10B981]/10 bg-white px-3 py-2.5 shadow-sm"
                        style={{ animation: `slide-up 0.4s ease-out ${0.7 + i * 0.08}s both` }}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#10B981]/10">
                          <b.icon className="h-4 w-4 text-[#10B981]" aria-hidden="true" />
                        </div>
                        <span className="text-xs font-semibold text-[#0F172A]">{b.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA buttons */}
                  <div
                    className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row"
                    style={{ animation: "slide-up 0.5s ease-out 1s both" }}
                  >
                    <button
                      type="button"
                      onClick={() => router.push("/statistics")}
                      className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] px-7 text-sm font-semibold text-white shadow-md shadow-[#10B981]/25 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      Explore Premium
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/dashboard")}
                      className="inline-flex h-12 items-center justify-center px-5 text-sm font-medium text-[#64748B] transition-colors hover:text-[#0F172A] rounded-xl"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              </>
            ) : paymentState === "failed" ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/50 p-6 text-center">
                <AlertTriangle
                  className="mx-auto h-10 w-10 text-red-500"
                  aria-hidden="true"
                />
                <h3 className="mt-3 text-lg font-bold text-[#0F172A]">
                  Payment couldn&apos;t be completed.
                </h3>
                <p className="mt-1 text-sm text-[#64748B]">
                  Your Premium access hasn&apos;t been activated.
                </p>
                {error && (
                  <p className="mt-2 text-sm font-medium text-red-600">
                    {error}
                  </p>
                )}
                <button
                  type="button"
                  onClick={resetCheckout}
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-5 text-sm font-semibold text-white shadow-md shadow-[#2563EB]/20 transition-all hover:-translate-y-0.5"
                >
                  Try again
                </button>
              </div>
            ) : paymentState === "expired" ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/50 p-6 text-center">
                <Clock className="mx-auto h-10 w-10 text-amber-500" aria-hidden="true" />
                <h3 className="mt-3 text-lg font-bold text-[#0F172A]">
                  This payment expired.
                </h3>
                <p className="mt-1 text-sm text-[#64748B]">
                  No charge was made. You can start a new checkout anytime.
                </p>
                <button
                  type="button"
                  onClick={resetCheckout}
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-5 text-sm font-semibold text-white shadow-md shadow-[#2563EB]/20 transition-all hover:-translate-y-0.5"
                >
                  Try again
                </button>
              </div>
            ) : paymentState === "cancelled" ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                <X className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
                <h3 className="mt-3 text-lg font-bold text-[#0F172A]">
                  Checkout closed.
                </h3>
                <p className="mt-1 text-sm text-[#64748B]">
                  No charge was made. Your free plan continues as normal.
                </p>
                <button
                  type="button"
                  onClick={resetCheckout}
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-5 text-sm font-semibold text-white shadow-md shadow-[#2563EB]/20 transition-all hover:-translate-y-0.5"
                >
                  Try again
                </button>
              </div>
            ) : paymentState === "pending" ? (
              <div className="mt-6 rounded-2xl border border-[#2563EB]/20 bg-[#2563EB]/[0.03] p-6 text-center">
                <Loader2
                  className="mx-auto h-8 w-8 animate-spin text-[#2563EB]"
                  aria-hidden="true"
                />
                <h3 className="mt-3 text-lg font-bold text-[#0F172A]">
                  {session ? "Complete your payment." : "Preparing secure checkout..."}
                </h3>
                <p className="mt-2 text-sm text-[#64748B]">
                  {session
                    ? "The Midtrans window should be open. Waiting for confirmation."
                    : "Preparing secure checkout..."}
                </p>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#64748B]">
                  <Lock className="h-3 w-3" aria-hidden="true" />
                  {session
                    ? "Confirming your payment..."
                    : "Secure payment powered by Midtrans"}
                </p>
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={startCheckout}
                  disabled={paymentState === "loading"}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-sm font-semibold text-white shadow-md shadow-[#2563EB]/20 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
                >
                  {paymentState === "loading" && (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  )}
                  Continue to checkout
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <p className="flex items-center justify-center gap-1.5 text-xs text-[#64748B]">
                  <Lock className="h-3 w-3 text-[#10B981]" aria-hidden="true" />
                  Secure payment powered by Midtrans
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto mt-20 max-w-2xl">
        <h2 className="text-center text-2xl font-bold text-[#0F172A]">
          Frequently asked questions
        </h2>
        <div className="mt-6 space-y-3">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-slate-200 bg-white px-6 py-4"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 rounded">
                {f.q}
                <ChevronRight className="h-4 w-4 shrink-0 text-[#64748B] transition-transform group-open:rotate-90" aria-hidden="true" />
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}