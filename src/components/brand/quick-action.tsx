import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function QuickAction({
  href,
  label,
  icon: Icon,
  accent = "orange",
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  accent?: "orange" | "green" | "navy" | "info";
}) {
  const accents = {
    orange: "bg-accent text-brand-orange",
    green: "bg-emerald-50 text-brand-success dark:bg-emerald-950/40",
    navy: "bg-muted text-brand-navy dark:text-foreground",
    info: "bg-blue-50 text-brand-info dark:bg-blue-950/40",
  };

  return (
    <Link
      href={href}
      className="pedigo-card flex flex-col items-center gap-2 p-4 text-center transition-colors hover:border-brand-orange/40 hover:bg-accent/50"
    >
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-2xl",
          accents[accent],
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-sm font-semibold text-foreground">{label}</span>
    </Link>
  );
}
