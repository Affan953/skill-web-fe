"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { adminApi } from "@/lib/api";
import { formatShortDate } from "@/lib/format";
import type { AdminSubscriptionRow, SubscriptionStatus } from "@/types";
import {
  Loader2,
  AlertCircle,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import DataTable, { type Column } from "@/components/admin/DataTable";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-[#10B981]/10 text-[#10B981]",
  EXPIRED: "bg-slate-100 text-slate-500",
  CANCELLED: "bg-red-100 text-red-600",
};

const FILTERS: Array<SubscriptionStatus | "ALL"> = [
  "ALL",
  "ACTIVE",
  "EXPIRED",
  "CANCELLED",
];

export default function AdminSubscriptionsPage() {
  const { getToken } = useFirebaseToken();
  const [status, setStatus] = useState<SubscriptionStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const {
    data: rows = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<AdminSubscriptionRow[], Error>({
    queryKey: ["admin-subscriptions", status, search],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return adminApi.getSubscriptions(token, status, search || undefined);
    },
    enabled: !!getToken,
  });

  const columns: Column<AdminSubscriptionRow>[] = useMemo(
    () => [
      {
        key: "userId",
        label: "User",
        render: (item) => (
          <span className="font-mono text-xs text-slate-500">
            {item.userId.slice(0, 12)}…
          </span>
        ),
      },
      {
        key: "plan",
        label: "Plan",
        render: (item) => (
          <span className="inline-flex items-center rounded-full bg-[#2563EB]/10 px-2.5 py-0.5 text-xs font-semibold text-[#2563EB]">
            {item.plan}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        render: (item) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[item.status] ?? "bg-slate-100 text-slate-500"}`}
          >
            {item.status}
          </span>
        ),
      },
      {
        key: "startedAt",
        label: "Started",
        sortable: true,
        render: (item) => (
          <span className="text-xs text-slate-500">
            {item.startedAt ? formatShortDate(item.startedAt) : "—"}
          </span>
        ),
      },
      {
        key: "expiredAt",
        label: "Expires",
        sortable: true,
        render: (item) => (
          <span className="text-xs text-slate-500">
            {item.expiredAt ? formatShortDate(item.expiredAt) : "—"}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscriptions</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage all Premium subscriptions.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setStatus(f)}
            aria-pressed={status === f}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              status === f
                ? "bg-[#2563EB] text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search user / subscription…"
          className="ml-auto w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#2563EB]" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-sm text-red-400">
            {error?.message ?? "Failed to load subscriptions"}
          </p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : (
        <DataTable<AdminSubscriptionRow>
          columns={columns}
          data={rows}
          searchPlaceholder="Search subscriptions…"
          searchKeys={["userId", "id"]}
          emptyTitle="No subscriptions found"
          emptyDescription="No subscriptions match your criteria."
        />
      )}
    </div>
  );
}