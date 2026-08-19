import { cn } from "@/lib/cn";

interface PlaceholderCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function PlaceholderCard({
  title,
  value,
  description,
  icon,
  className,
}: PlaceholderCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white border border-slate-200 p-6 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          {description && (
            <p className="mt-1 text-sm text-slate-400">{description}</p>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-500">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
