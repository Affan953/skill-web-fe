"use client";

import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";

interface DeleteHabitDialogProps {
  open: boolean;
  habitTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export default function DeleteHabitDialog({
  open,
  habitTitle,
  onConfirm,
  onCancel,
  loading,
}: DeleteHabitDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-label="Delete habit"
    >
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={loading ? undefined : onCancel}
      />
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl">
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="text-base font-bold text-[#0F172A]">Delete Habit</h3>
        <p className="mt-1 text-xs text-[#64748B]">
          This action cannot be undone.
        </p>

        <p className="mt-4 rounded-2xl border border-slate-100 bg-[#F8FAFC] px-4 py-3 text-xs leading-relaxed text-[#64748B]">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-[#0F172A]">
            &quot;{habitTitle}&quot;
          </span>
          ? All related progress will be removed.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="h-12 flex-1 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-[#64748B] transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 text-sm font-semibold text-white transition-all duration-200 hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/25 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
