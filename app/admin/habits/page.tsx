"use client";

import { useMemo } from "react";
import { CheckSquare, Pencil, Trash2, Star, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import DataTable, { type Column } from "@/components/admin/DataTable";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { adminApi } from "@/lib/api";
import type { AdminHabitRow } from "@/types";

const difficultyColors: Record<string, string> = {
  Easy: "bg-[#10B981]/10 text-[#10B981]",
  Medium: "bg-amber-100 text-amber-600",
  Hard: "bg-red-100 text-red-600",
};

const statusColors: Record<string, string> = {
  Active: "bg-[#10B981]/10 text-[#10B981]",
  Paused: "bg-amber-100 text-amber-600",
  Archived: "bg-slate-100 text-slate-500",
};

export default function AdminHabitsPage() {
  const { getToken } = useFirebaseToken();

  const { data: habits = [], isLoading, isError, refetch } = useQuery<AdminHabitRow[]>({
    queryKey: ["admin-habits"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return adminApi.getHabits(token);
    },
    enabled: !!getToken,
  });

  const data = useMemo(() => habits.map((h) => ({ ...h, status: "Active" as const })), [habits]);

  const columns: Column<AdminHabitRow & { status: "Active" }>[] = useMemo(
    () => [
      {
        key: "title",
        label: "Habit",
        sortable: true,
        render: (item) => (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2563EB]/10">
              <CheckSquare className="h-4 w-4 text-[#2563EB]" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-400">{item.ownerName}</p>
            </div>
          </div>
        ),
      },
      {
        key: "category",
        label: "Category",
        sortable: true,
        render: (item) => (
          <span className="text-sm text-slate-600">{item.category}</span>
        ),
      },
      {
        key: "difficulty",
        label: "Difficulty",
        render: (item) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              difficultyColors[item.difficulty] || ""
            }`}
          >
            {item.difficulty}
          </span>
        ),
      },
      {
        key: "xpReward",
        label: "XP Reward",
        sortable: true,
        render: (item) => (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-600">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {item.xpReward}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (item) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              statusColors[item.status] || ""
            }`}
          >
            {item.status}
          </span>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        render: () => (
          <div className="flex items-center gap-1">
            <button
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Edit habit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500"
              aria-label="Delete habit"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Habit Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          View and manage all habits across users.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-slate-500">Failed to load habits.</p>
          <button
            onClick={() => refetch()}
            className="mt-3 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8]"
          >
            Retry
          </button>
        </div>
      ) : (
        <DataTable<AdminHabitRow & { status: "Active" }>
          columns={columns}
          data={data}
          searchPlaceholder="Search habits..."
          searchKeys={["title", "category", "ownerName"]}
          emptyTitle="No habits found"
          emptyDescription="No habits match your search criteria."
        />
      )}
    </div>
  );
}
