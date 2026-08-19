"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import type { User } from "@/types";
import {
  User as UserIcon,
  Mail,
  Calendar,
  Edit3,
  X,
  Loader2,
  RotateCcw,
  AlertCircle,
  Shield,
  Camera,
  LogOut,
  Key,
  Clock,
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

function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SkeletonProfile() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 rounded-lg bg-slate-100" />
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="h-24 w-24 rounded-full bg-slate-100" />
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div className="mx-auto h-6 w-40 rounded bg-slate-100 sm:mx-0" />
              <div className="mx-auto h-4 w-56 rounded bg-slate-100 sm:mx-0" />
              <div className="mx-auto h-3 w-32 rounded bg-slate-100 sm:mx-0" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl border border-slate-200 bg-white"
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
    <div className="flex flex-col items-center gap-4 rounded-xl border border-red-500/20 bg-white p-12 text-center">
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

          <div>
            <label
              htmlFor="admin-username"
              className="mb-1 block text-xs font-medium text-slate-500"
            >
              Username *
            </label>
            <input
              id="admin-username"
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

          <div>
            <label
              htmlFor="admin-photo"
              className="mb-1 block text-xs font-medium text-slate-500"
            >
              Profile Picture URL
            </label>
            <input
              id="admin-photo"
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

export default function AdminProfilePage() {
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
    queryKey: ["admin-profile", authUser?.uid ?? "me"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return usersApi.getMe(token);
    },
    enabled: !!getToken && !!authUser,
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
        await queryClient.invalidateQueries({ queryKey: ["admin-profile", "me"] });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your admin account and preferences.
        </p>
      </div>

      {/* Profile Header */}
      <section>
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 shadow-lg">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
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
              <div className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#10B981]">
                <Shield className="h-3.5 w-3.5 text-white" />
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <h2 className="text-2xl font-bold text-slate-900">
                  {profileUser.username}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#10B981]/10 px-2.5 py-0.5 text-xs font-semibold text-[#10B981]">
                  <Shield className="h-3 w-3" />
                  Admin
                </span>
              </div>
              <div className="mt-1 flex items-center justify-center gap-2 text-sm text-slate-500 sm:justify-start">
                <Mail className="h-4 w-4" />
                {firebaseUser?.email ?? profileUser.email}
              </div>
              <div className="mt-1 flex items-center justify-center gap-2 text-xs text-slate-400 sm:justify-start">
                <Calendar className="h-3.5 w-3.5" />
                Member since {formatDate(profileUser.createdAt)}
              </div>
            </div>

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

      {/* Account Details */}
      <section>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Account Details
        </h3>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 py-3">
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

            <div className="flex items-center justify-between border-b border-slate-100 py-3">
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

            <div className="flex items-center justify-between border-b border-slate-100 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#10B981]/10">
                  <Shield className="h-4 w-4 text-[#10B981]" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Role</p>
                  <p className="text-sm font-medium text-slate-900">Administrator</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                  <Key className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">User ID</p>
                  <p className="font-mono text-xs text-slate-500">
                    {profileUser.uid}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                  <Calendar className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Joined</p>
                  <p className="text-sm font-medium text-slate-900">
                    {formatDate(profileUser.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100">
                  <Clock className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Last Updated</p>
                  <p className="text-sm font-medium text-slate-900">
                    {formatDateTime(profileUser.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={() => router.push("/admin/settings")}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left transition-colors hover:border-[#2563EB]/30 hover:shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563EB]/10">
              <Key className="h-5 w-5 text-[#2563EB]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Admin Settings
              </p>
              <p className="text-xs text-slate-500">
                Manage platform configuration
              </p>
            </div>
          </button>

          <button
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
            className="flex items-center gap-4 rounded-xl border border-red-200 bg-red-50 p-5 text-left transition-colors hover:bg-red-100"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <LogOut className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-600">Logout</p>
              <p className="text-xs text-red-400">
                Sign out of admin account
              </p>
            </div>
          </button>
        </div>
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
