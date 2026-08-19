import { Bell } from "lucide-react";

export default function NotificationEmpty() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-50">
        <Bell className="h-7 w-7 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-500">No notifications yet.</p>
      <p className="mt-1 max-w-xs text-xs text-slate-400">
        Complete habits and achieve milestones to receive notifications.
      </p>
    </div>
  );
}
