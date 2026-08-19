export default function NotificationSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-slate-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-slate-100" />
              <div className="h-3 w-full rounded bg-slate-100" />
              <div className="h-3 w-1/3 rounded bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
