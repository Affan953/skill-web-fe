"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { adminApi } from "@/lib/api";
import type { AdminUserRow } from "@/types";
import {
  Eye,
  Pencil,
  Ban,
  Trash2,
  UserPlus,
  Loader2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import Image from "next/image";
import DataTable, { type Column } from "@/components/admin/DataTable";

const AVATAR_COLORS = [
  "bg-[#2563EB]",
  "bg-[#10B981]",
  "bg-amber-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-slate-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(uid: string): string {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function UsersPage() {
  const { getToken } = useFirebaseToken();

  const {
    data: users = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<AdminUserRow[], Error>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return adminApi.getUsers(token);
    },
    enabled: !!getToken,
  });

  const data = useMemo(() => users, [users]);

  const columns: Column<AdminUserRow>[] = useMemo(
    () => [
      {
        key: "username",
        label: "User",
        sortable: true,
        render: (item) => (
          <div className="flex items-center gap-3">
            {item.photoUrl ? (
              <Image
                src={item.photoUrl}
                alt={item.username}
                width={32}
                height={32}
                className="h-8 w-8 shrink-0 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${getAvatarColor(item.uid)}`}
              >
                {getInitials(item.username)}
              </div>
            )}
            <div>
              <p className="font-medium text-slate-900">{item.username}</p>
              <p className="text-xs text-slate-400">{item.email}</p>
            </div>
          </div>
        ),
      },
      {
        key: "level",
        label: "Level",
        sortable: true,
        render: (item) => (
          <span className="inline-flex items-center rounded-full bg-[#2563EB]/10 px-2.5 py-0.5 text-xs font-semibold text-[#2563EB]">
            Lv. {item.level}
          </span>
        ),
      },
      {
        key: "xp",
        label: "XP",
        sortable: true,
        render: (item) => (
          <span className="text-sm font-medium text-amber-600">
            {item.xp.toLocaleString()}
          </span>
        ),
      },
      {
        key: "currentStreak",
        label: "Streak",
        sortable: true,
        render: (item) => (
          <span className="text-sm text-slate-600">{item.currentStreak} days</span>
        ),
      },
      {
        key: "role",
        label: "Role",
        sortable: true,
        render: (item) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              item.role === "admin"
                ? "bg-purple-100 text-purple-600"
                : "bg-[#10B981]/10 text-[#10B981]"
            }`}
          >
            {item.role}
          </span>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        render: () => (
          <div className="flex items-center gap-1">
            <button
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#2563EB]"
              aria-label="View user"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Edit user"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-orange-500"
              aria-label="Disable user"
            >
              <Ban className="h-4 w-4" />
            </button>
            <button
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500"
              aria-label="Delete user"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-sm text-red-400">{error?.message ?? "Failed to load users"}</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
        >
          <RotateCcw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            User Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage all registered users.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#2563EB]/20 transition-all hover:bg-[#1D4ED8]">
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      <DataTable<AdminUserRow>
        columns={columns}
        data={data}
        searchPlaceholder="Search users..."
        searchKeys={["username", "email"]}
        emptyTitle="No users found"
        emptyDescription="No users match your search criteria."
      />
    </div>
  );
}
