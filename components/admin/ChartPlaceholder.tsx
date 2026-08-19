interface ChartPlaceholderProps {
  title: string;
  description?: string;
  height?: string;
  type?: "bar" | "line" | "area" | "donut";
}

export default function ChartPlaceholder({
  title,
  description,
  height = "h-48",
  type = "bar",
}: ChartPlaceholderProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-slate-400">{description}</p>
        )}
      </div>
      <div
        className={`flex items-end justify-center gap-2 ${height} rounded-lg bg-slate-50 p-4`}
      >
        {type === "bar" &&
          [40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 68].map((h, i) => (
            <div
              key={i}
              className="w-full max-w-[24px] rounded-t bg-[#2563EB]/20 transition-all hover:bg-[#2563EB]/40"
              style={{ height: `${h}%` }}
            />
          ))}
        {type === "line" && (
          <svg
            className="h-full w-full"
            viewBox="0 0 400 120"
            preserveAspectRatio="none"
          >
            <polyline
              fill="none"
              stroke="#2563EB"
              strokeWidth="2"
              opacity="0.3"
              points="0,80 40,60 80,70 120,40 160,50 200,30 240,45 280,20 320,35 360,15 400,25"
            />
            <polyline
              fill="url(#lineGrad)"
              stroke="none"
              points="0,80 40,60 80,70 120,40 160,50 200,30 240,45 280,20 320,35 360,15 400,25 400,120 0,120"
            />
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        )}
        {type === "area" && (
          <svg
            className="h-full w-full"
            viewBox="0 0 400 120"
            preserveAspectRatio="none"
          >
            <rect
              x="10"
              y="40"
              width="30"
              height="80"
              rx="4"
              fill="#2563EB"
              opacity="0.15"
            />
            <rect
              x="50"
              y="25"
              width="30"
              height="95"
              rx="4"
              fill="#2563EB"
              opacity="0.2"
            />
            <rect
              x="90"
              y="50"
              width="30"
              height="70"
              rx="4"
              fill="#2563EB"
              opacity="0.15"
            />
            <rect
              x="130"
              y="15"
              width="30"
              height="105"
              rx="4"
              fill="#2563EB"
              opacity="0.25"
            />
            <rect
              x="170"
              y="30"
              width="30"
              height="90"
              rx="4"
              fill="#2563EB"
              opacity="0.2"
            />
            <rect
              x="210"
              y="10"
              width="30"
              height="110"
              rx="4"
              fill="#2563EB"
              opacity="0.3"
            />
            <rect
              x="250"
              y="35"
              width="30"
              height="85"
              rx="4"
              fill="#2563EB"
              opacity="0.2"
            />
            <rect
              x="290"
              y="20"
              width="30"
              height="100"
              rx="4"
              fill="#2563EB"
              opacity="0.25"
            />
            <rect
              x="330"
              y="40"
              width="30"
              height="80"
              rx="4"
              fill="#2563EB"
              opacity="0.15"
            />
            <rect
              x="370"
              y="28"
              width="30"
              height="92"
              rx="4"
              fill="#2563EB"
              opacity="0.2"
            />
          </svg>
        )}
        {type === "donut" && (
          <div className="flex items-center justify-center">
            <svg className="h-28 w-28" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="12"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#2563EB"
                strokeWidth="12"
                strokeDasharray="160 251.2"
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#10B981"
                strokeWidth="12"
                strokeDasharray="60 251.2"
                strokeDashoffset="-160"
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
