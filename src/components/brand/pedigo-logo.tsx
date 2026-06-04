import { cn } from "@/lib/utils";

/** Isotipo + wordmark PediGo (guía de marca). */
export function PedigoLogo({
  className,
  showWordmark = true,
  size = "md",
}: {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const box =
    size === "sm" ? "h-8 w-8 text-sm" : size === "lg" ? "h-11 w-11 text-lg" : "h-9 w-9 text-base";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl bg-brand-orange font-heading font-extrabold text-white shadow-sm",
          box,
        )}
        aria-hidden
      >
        P
      </div>
      {showWordmark && (
        <span className="font-heading text-lg font-bold leading-none tracking-tight">
          <span className="text-brand-navy dark:text-foreground">Pedi</span>
          <span className="text-brand-orange">Go</span>
        </span>
      )}
    </div>
  );
}
