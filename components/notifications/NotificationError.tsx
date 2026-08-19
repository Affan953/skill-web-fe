import { AlertCircle, RotateCcw } from "lucide-react";

interface NotificationErrorProps {
  message: string;
  onRetry: () => void;
}

export default function NotificationError({
  message,
  onRetry,
}: NotificationErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-white py-16 text-center">
      <AlertCircle className="mb-3 h-10 w-10 text-red-400" />
      <p className="mb-4 text-sm text-red-400">{message}</p>
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
