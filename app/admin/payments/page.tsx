"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFirebaseToken } from "@/hooks/useFirebaseToken";
import { adminApi } from "@/lib/api";
import { formatIDR, formatShortDate } from "@/lib/format";
import type {
  AdminPaymentDashboard,
  AdminPaymentRow,
} from "@/types";
import {
  Loader2,
  AlertCircle,
  RotateCcw,
  Wallet,
  Users,
  Clock,
  XCircle,
  Search,
  RefreshCw,
} from "lucide-react";
import StatCard from "@/components/admin/StatCard";
import DataTable, { type Column } from "@/components/admin/DataTable";

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-[#10B981]/10 text-[#10B981]",
  PENDING: "bg-[#F59E0B]/10 text-[#F59E0B]",
  FAILED: "bg-red-100 text-red-600",
  EXPIRED: "bg-slate-100 text-slate-500",
  CANCELLED: "bg-slate-100 text-slate-500",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-500"}`}
    >
      {status}
    </span>
  );
}

export default function AdminPaymentsPage() {
  const { getToken } = useFirebaseToken();
  const [search, setSearch] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<AdminPaymentDashboard, Error>({
    queryKey: ["admin-payments", search],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return adminApi.getPayments(token, search || undefined);
    },
    enabled: !!getToken,
  });

  const columns: Column<AdminPaymentRow>[] = useMemo(
    () => [
      {
        key: "orderId",
        label: "Order ID",
        render: (item) => (
          <span className="font-mono text-xs text-slate-700">
            {item.orderId}
          </span>
        ),
      },
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
        key: "amount",
        label: "Amount",
        sortable: true,
        render: (item) => (
          <span className="text-sm font-semibold text-slate-900 tabular-nums">
            {formatIDR(item.amount)}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        render: (item) => <StatusBadge status={item.status} />,
      },
      {
        key: "createdAt",
        label: "Created",
        sortable: true,
        render: (item) => (
          <span className="text-xs text-slate-500">
            {item.createdAt ? formatShortDate(item.createdAt) : "—"}
          </span>
        ),
      },
      {
        key: "processedAt",
        label: "Processed",
        render: (item) => (
          <span className="text-xs text-slate-500">
            {item.processedAt ? formatShortDate(item.processedAt) : "—"}
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
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor all Premium transactions.
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

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#2563EB]" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-sm text-red-400">
            {error?.message ?? "Failed to load payments"}
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
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Revenue"
              value={formatIDR(data?.summary.totalRevenue ?? 0)}
              icon={Wallet}
              color="bg-[#10B981]/10 text-[#10B981]"
            />
            <StatCard
              title="Premium Users"
              value={data?.summary.premiumUsers ?? 0}
              icon={Users}
              color="bg-[#2563EB]/10 text-[#2563EB]"
            />
            <StatCard
              title="Pending Payments"
              value={data?.summary.pendingPayments ?? 0}
              icon={Clock}
              color="bg-[#F59E0B]/10 text-[#F59E0B]"
            />
            <StatCard
              title="Failed Payments"
              value={data?.summary.failedPayments ?? 0}
              icon={XCircle}
              color="bg-red-100 text-red-500"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isFetching ? "Refreshing…" : "Search by order ID or user…"
              }
              className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <DataTable<AdminPaymentRow>
            columns={columns}
            data={data?.payments ?? []}
            searchPlaceholder="Filter transactions…"
            searchKeys={["orderId", "userId"]}
            emptyTitle="No payments found"
            emptyDescription="No transactions match your criteria."
          />
        </>
      )}
    </div>
  );
}