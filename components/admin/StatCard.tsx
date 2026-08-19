import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  color?: string;
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = "bg-[#2563EB]/10 text-[#2563EB]",
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          {description && (
            <p className="mt-1 text-sm text-slate-400">{description}</p>
          )}
          {trend && (
            <p
              className={`mt-2 text-xs font-medium ${
                trend.positive ? "text-[#10B981]" : "text-red-500"
              }`}
            >
              {trend.positive ? "+" : ""}
              {trend.value}
            </p>
          )}
        </div>
        <div className={`rounded-xl p-3 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
