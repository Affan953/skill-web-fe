export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="h-8 w-16 rounded bg-slate-200" />
          <div className="h-3 w-20 rounded bg-slate-100" />
        </div>
        <div className="h-10 w-10 rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="h-8 w-64 rounded bg-slate-200" />
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex gap-4">
              {Array.from({ length: cols }).map((_, c) => (
                <div
                  key={c}
                  className="h-4 flex-1 rounded bg-slate-100"
                  style={{ maxWidth: c === 0 ? "40px" : undefined }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-4 space-y-2">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="h-3 w-48 rounded bg-slate-100" />
      </div>
      <div className="flex h-48 items-end justify-center gap-2 rounded-lg bg-slate-50 p-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="w-full max-w-[24px] rounded-t bg-slate-200"
            style={{ height: `${30 + ((i * 17 + 13) % 60)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white">
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-6 py-4">
            <div className="h-8 w-8 rounded-lg bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 rounded bg-slate-200" />
              <div className="h-3 w-24 rounded bg-slate-100" />
            </div>
            <div className="h-3 w-16 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
