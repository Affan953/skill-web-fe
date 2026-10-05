"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { useAuth } from "@/contexts/AuthContext";
import { usersApi } from "@/lib/api";
import { usePaymentHistory } from "@/hooks/usePayments";
import { formatIDR, formatShortDate } from "@/lib/format";
import {
  Settings,
  Loader2,
  CheckCircle2,
  User,
  Sparkles,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import BlockedUsersPanel from "@/components/safety/BlockedUsersPanel";

function PaymentHistory() {
  const { data, isLoading } = usePaymentHistory();

  return (
    <div className="mt-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Payment History
      </p>
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
          No payments yet. Upgrade to Premium to get started.
        </p>
      ) : (
        <div className="space-y-2">
          {data.map((p) => (
            <div
              key={p.orderId}
              className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  SkillUp Premium
                </p>
                <p className="text-xs text-slate-500">
                  {p.createdAt
                    ? formatShortDate(p.createdAt)
                    : ""}{" "}
                  · <span className="font-mono">{p.orderId}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 tabular-nums">
                  {formatIDR(p.amount)}
                </p>
                <StatusBadge status={p.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  PAID: "Paid",
  PENDING: "Pending",
  FAILED: "Failed",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: "bg-[#10B981]/10 text-[#10B981]",
    PENDING: "bg-[#F59E0B]/10 text-[#F59E0B]",
    FAILED: "bg-red-100 text-red-600",
    EXPIRED: "bg-slate-100 text-slate-500",
    CANCELLED: "bg-slate-100 text-slate-500",
  };
  return (
    <span
      className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        styles[status] ?? "bg-slate-100 text-slate-500"
      }`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function SettingsContent() {
  const { user, refreshUser, firebaseUser } = useAuth();
  const { getToken } = useFirebaseToken();
  const [username, setUsername] = useState(user?.username || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const token = await getToken();
      if (!token) return;
      setSaving(true);
      setSaved(false);
      setError(null);
      try {
        await usersApi.updateProfile(token, { username });
        await refreshUser();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError("Failed to update profile. Please try again.");
        console.error("Failed to update profile:", err);
      } finally {
        setSaving(false);
      }
    },
    [getToken, username, refreshUser]
  );

  return (
    <div className="flex-1 px-6 py-8">
      <section className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your account settings
            </p>
          </section>

          <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-6 flex items-center gap-2">
                <User className="h-5 w-5 text-[#2563EB]" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Profile
                </h3>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label htmlFor="settings-username" className="mb-1 block text-xs font-medium text-slate-500">
                    Username
                  </label>
                  <input
                    id="settings-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none sm:w-96"
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label htmlFor="settings-email" className="mb-1 block text-xs font-medium text-slate-500">
                    Email
                  </label>
                  <input
                    id="settings-email"
                    type="email"
                    value={firebaseUser?.email || ""}
                    disabled
                    className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 sm:w-96"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Email cannot be changed
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {error && (
                    <p role="alert" className="text-sm text-red-500">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={saving || !username.trim()}
                    className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : saved ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : null}
                    {saving
                      ? "Saving..."
                      : saved
                      ? "Saved!"
                      : "Save Changes"}
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#2563EB]" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Privacy &amp; Safety
                </h3>
              </div>
              <BlockedUsersPanel />
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#2563EB]" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Billing & Subscription
                </h3>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB]/10">
                    <Sparkles className="h-5 w-5 text-[#2563EB]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {user?.isPremium ? "Premium" : "Free Plan"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {user?.isPremium && user?.premiumExpiresAt
                        ? `Active until ${new Date(
                            user.premiumExpiresAt
                          ).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}`
                        : user?.isPremium
                          ? "Active"
                          : "Your free plan includes all essential features."}
                    </p>
                  </div>
                </div>
                <Link
                  href="/upgrade"
                  className={
                    user?.isPremium
                      ? "inline-flex items-center gap-1.5 rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-300"
                      : "inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[#2563EB]/20 transition-all hover:shadow-md"
                  }
                >
                  {user?.isPremium ? "Manage" : "Upgrade"}
                </Link>
              </div>

              <PaymentHistory />
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#2563EB]" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Account Info
                </h3>
              </div>
              <div className="space-y-3">
                {/* Phase 36: the Firebase uid is an internal identifier and is
                    no longer shown here. Your username is the handle other
                    people use to find you, and it is shown above. */}
                <div className="flex items-center justify-between py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-500">Username</span>
                  <span className="text-xs text-slate-500">
                    @{user?.username || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-500">Member Since</span>
                  <span className="text-xs text-slate-500" suppressHydrationWarning>
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US")
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-500">Last Updated</span>
                  <span className="text-xs text-slate-500" suppressHydrationWarning>
                    {user?.updatedAt
                      ? new Date(user.updatedAt).toLocaleDateString("en-US")
                      : "N/A"}
                  </span>
                </div>
              </div>
            </section>
          </div>
    </div>
  );
}

export default function SettingsPage() {
  return <SettingsContent />;
}
