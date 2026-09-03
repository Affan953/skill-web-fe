"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import PlaceholderCard from "@/components/PlaceholderCard";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi, achievementsApi } from "@/lib/api";
import { levelSpan, xpIntoLevel, xpRemaining, levelPercent } from "@/lib/xp";
import type { User, Achievement } from "@/types";
import {
  User as UserIcon,
  Mail,
  Calendar,
  Edit3,
  X,
  Loader2,
  RotateCcw,
  AlertCircle,
  Zap,
  Flame,
  Trophy,
  CheckCircle2,
  Camera,
  Bell,
  Shield,
  Palette,
  Info,
  LogOut,
} from "lucide-react";
import Image from "next/image";

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function SkeletonProfile() {
  return (
    <div className="flex-1 px-6 py-8">
      <div className="animate-pulse space-y-8">
      {/* Header skeleton */}
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-white p-8 sm:flex-row">
        <div className="h-24 w-24 rounded-full bg-slate-100" />
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div className="mx-auto h-6 w-40 rounded bg-slate-100 sm:mx-0" />
          <div className="mx-auto h-4 w-56 rounded bg-slate-100 sm:mx-0" />
          <div className="mx-auto h-3 w-32 rounded bg-slate-100 sm:mx-0" />
        </div>
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-slate-200 bg-white"
          />
        ))}
      </div>
          </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-8">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-red-500/20 bg-white p-8 text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-sm text-red-400">{message}</p>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
        >
          <RotateCcw className="h-4 w-4" />
          Retry
        </button>
      </div>
    </div>
  );
}

function EditProfileModal({
  user,
  onClose,
  onSave,
  saving,
}: {
  user: User;
  onClose: () => void;
  onSave: (data: { username: string; photoUrl: string }) => Promise<void>;
  saving: boolean;
}) {
  const [username, setUsername] = useState(user.username);
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl ?? "");

  const canSave = username.trim().length >= 3 && !saving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    await onSave({ username: username.trim(), photoUrl: photoUrl.trim() });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar preview */}
          <div className="flex justify-center">
            <div className="relative">
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt="Preview"
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-slate-200"
                  unoptimized
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#2563EB] text-2xl font-bold text-white">
                  {username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                <Camera className="h-3 w-3 text-slate-500" />
              </div>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Username *
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              maxLength={50}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              placeholder="Enter username"
            />
            {username.trim().length > 0 && username.trim().length < 3 && (
              <p className="mt-1 text-[10px] text-red-400">
                Username must be at least 3 characters
              </p>
            )}
          </div>

          {/* Photo URL */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Profile Picture URL
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              placeholder="https://example.com/avatar.png"
            />
            <p className="mt-1 text-[10px] text-slate-400">
              Paste a URL to your profile picture
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#2563EB] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProfileContent() {
  const { user: authUser, firebaseUser, refreshUser, logout } = useAuth();
  const { getToken } = useFirebaseToken();
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    data: profileUser,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<User, Error>({
    queryKey: ["profile", authUser?.uid ?? "me"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return usersApi.getMe(token);
    },
    enabled: !!getToken && !!authUser,
  });

  const { data: achievements = [] } = useQuery<Achievement[], Error>({
    queryKey: ["achievements"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return achievementsApi.getAll(token);
    },
    enabled: !!getToken,
  });

  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(
    async (data: { username: string; photoUrl: string }) => {
      const token = await getToken();
      if (!token) return;
      setSaving(true);
      try {
        await usersApi.updateProfile(token, {
          username: data.username,
          photoUrl: data.photoUrl || undefined,
        });
        await refreshUser();
        await queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
        setShowEdit(false);
      } catch (err) {
        console.error("Failed to update profile:", err);
      } finally {
        setSaving(false);
      }
    },
    [getToken, refreshUser, queryClient]
  );

  if (isLoading) return <SkeletonProfile />;

  if (isError || !profileUser) {
    return (
      <ErrorState
        message={error?.message ?? "Failed to load profile"}
        onRetry={() => refetch()}
      />
    );
  }

  const achievementCount = achievements.filter((a) => a.unlocked).length;
  const xpNeeded = levelSpan(profileUser.level);
  const xpInto = xpIntoLevel(profileUser.level, profileUser.xp);
  const xpLeft = xpRemaining(profileUser.level, profileUser.xp);
  const xpProgress = levelPercent(profileUser.level, profileUser.xp);

  return (
    <div className="flex-1 px-6 py-8">
      {/* Profile Header */}
          <section className="mb-8">
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 shadow-lg">
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {profileUser.photoUrl ? (
                    <Image
                      src={profileUser.photoUrl}
                      alt={profileUser.username}
                      width={96}
                      height={96}
                      className="h-24 w-24 rounded-full object-cover ring-4 ring-[#2563EB]/30"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#60A5FA] text-3xl font-bold text-white ring-4 ring-[#2563EB]/30">
                      {profileUser.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#1E293B] bg-[#2563EB]">
                    <span className="text-[10px] font-bold text-white">
                      {profileUser.level}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {profileUser.username}
                  </h1>
                  <div className="mt-1 flex items-center justify-center gap-2 text-sm text-slate-500 sm:justify-start">
                    <Mail className="h-4 w-4" />
                    {firebaseUser?.email ?? profileUser.email}
                  </div>
                  <div className="mt-1 flex items-center justify-center gap-2 text-xs text-slate-400 sm:justify-start">
                    <Calendar className="h-3.5 w-3.5" />
                    Member since {formatDate(profileUser.createdAt)}
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-4 sm:justify-start">
                    <div className="flex items-center gap-1.5 rounded-full bg-[#2563EB]/10 px-3 py-1">
                      <Trophy className="h-3.5 w-3.5 text-[#2563EB]" />
                      <span className="text-xs font-semibold text-[#2563EB]">
                        Level {profileUser.level}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-xs font-semibold text-amber-600">
                        {profileUser.xp.toLocaleString()} XP
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1">
                      <Flame className="h-3.5 w-3.5 text-orange-500" />
                      <span className="text-xs font-semibold text-orange-600">
                        {profileUser.currentStreak} day streak
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit button */}
                <button
                  onClick={() => setShowEdit(true)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:border-[#2563EB]/50 hover:text-slate-900"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Profile
                </button>
              </div>
            </div>
          </section>

          {/* XP Progress */}
          <section className="mb-8">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-slate-900">
                  Level {profileUser.level}
                </span>
                <span className="text-xs text-slate-500">
                  {xpInto.toLocaleString()} / {xpNeeded.toLocaleString()} XP
                </span>
              </div>
              <div
                className="h-3 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-valuenow={xpProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="XP progress"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA] transition-all duration-700 ease-out"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <p className="mt-1.5 text-right text-xs text-slate-400">
                {xpProgress}% — {xpLeft} XP to Level{" "}
                {profileUser.level + 1}
              </p>
            </div>
          </section>

          {/* Statistics */}
          <section className="mb-8">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Statistics
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <PlaceholderCard
                title="Current Level"
                value={profileUser.level}
                description="Keep earning XP to level up"
                icon={<Trophy className="h-5 w-5" />}
              />
              <PlaceholderCard
                title="Total XP"
                value={profileUser.xp.toLocaleString()}
                description="Experience points earned"
                icon={<Zap className="h-5 w-5" />}
              />
              <PlaceholderCard
                title="Day Streak"
                value={profileUser.currentStreak}
                description={
                  profileUser.currentStreak === 1
                    ? "Day in a row"
                    : "Days in a row"
                }
                icon={<Flame className="h-5 w-5" />}
              />
              <PlaceholderCard
                title="Total Habits"
                value={profileUser.totalHabits}
                description="Habits being tracked"
                icon={<CheckCircle2 className="h-5 w-5" />}
              />
              <PlaceholderCard
                title="Longest Streak"
                value={profileUser.longestStreak}
                description="Best streak record"
                icon={<Flame className="h-5 w-5" />}
              />
              <PlaceholderCard
                title="Achievements"
                value={achievementCount}
                description="Badges unlocked"
                icon={<Trophy className="h-5 w-5" />}
              />
            </div>
          </section>

          {/* Account Information */}
          <section>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Account Information
            </h3>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB]/10">
                      <UserIcon className="h-4 w-4 text-[#2563EB]" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Username</p>
                      <p className="text-sm font-medium text-slate-900">
                        {profileUser.username}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB]/10">
                      <Mail className="h-4 w-4 text-[#2563EB]" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-sm font-medium text-slate-900">
                        {firebaseUser?.email ?? profileUser.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB]/10">
                      <span className="text-xs font-bold text-[#2563EB]">
                        ID
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">User ID</p>
                      <p className="font-mono text-xs text-slate-500">
                        {profileUser.uid}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB]/10">
                      <Calendar className="h-4 w-4 text-[#2563EB]" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Joined</p>
                      <p className="text-sm font-medium text-slate-900">
                        {formatDate(profileUser.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Settings */}
          <section className="mb-8">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Settings
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-[#2563EB]/30 hover:shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB]/10">
                    <UserIcon className="h-4 w-4 text-[#2563EB]" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">Account</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Manage your account settings and preferences
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-[#2563EB]/30 hover:shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                    <Bell className="h-4 w-4 text-amber-500" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">Notifications</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Configure notification and reminder preferences
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-[#2563EB]/30 hover:shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                    <Shield className="h-4 w-4 text-emerald-500" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">Privacy</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Control your privacy and data settings
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-[#2563EB]/30 hover:shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100">
                    <Palette className="h-4 w-4 text-purple-500" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">Appearance</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Customize the look and feel of the app
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-[#2563EB]/30 hover:shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                    <Info className="h-4 w-4 text-slate-500" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">About</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Learn more about SkillUp RPG
                </p>
              </div>
            </div>
          </section>

          {/* Logout */}
          <section>
            <button
              onClick={async () => {
                await logout();
                router.push("/login");
              }}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </section>

      {/* Edit Modal */}
      {showEdit && (
        <EditProfileModal
          user={profileUser}
          onClose={() => setShowEdit(false)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  );
}

export default function ProfilePage() {
  return <ProfileContent />;
}
