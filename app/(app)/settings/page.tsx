"use client";

import { useState, useCallback } from "react";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { useAuth } from "@/contexts/AuthContext";
import { usersApi } from "@/lib/api";
import { Settings, Loader2, CheckCircle2, User } from "lucide-react";

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
                <Settings className="h-5 w-5 text-[#2563EB]" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Account Info
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-500">UID</span>
                  <span className="font-mono text-xs text-slate-500">
                    {user?.uid || "N/A"}
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
