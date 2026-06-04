import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  trend?: { value: string; positive?: boolean };
  className?: string;
}) {
  return (
    <div className={cn("pedigo-card flex flex-col gap-3 p-5", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-brand-orange">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div>
        <p className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        {trend && (
          <p
            className={cn(
              "mt-2 text-xs font-semibold",
              trend.positive ? "text-brand-success" : "text-muted-foreground",
            )}
          >
            {trend.value}
          </p>
        )}
      </div>
    </div>
  );
}
