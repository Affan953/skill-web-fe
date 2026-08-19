import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = "Something went wrong",
  message = "An error occurred while loading data.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-red-200 bg-red-50/50 px-6 py-16 text-center">
      <div className="rounded-2xl bg-red-100 p-4">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-red-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-red-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      )}
    </div>
  );
}
