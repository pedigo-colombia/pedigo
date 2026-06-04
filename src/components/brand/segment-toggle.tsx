"use client";

import { cn } from "@/lib/utils";

/** Botones segmentados legibles en modo claro y oscuro. */
export function SegmentToggle<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "border-brand-orange bg-brand-orange text-white shadow-sm"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
