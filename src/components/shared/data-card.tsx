import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Lista tipo tarjeta para móvil (sustituto de tablas anchas). */
export function DataCardList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col gap-3 md:hidden", className)}>{children}</div>;
}

export function DataCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <Card className={cn("min-w-0 p-4", className)}>{children}</Card>;
}

export function DataCardRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 first:mt-0">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{children}</span>
    </div>
  );
}

/** Tabla solo en pantallas medianas+; el scroll horizontal queda dentro del card. */
export function DataTableDesktop({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("hidden min-w-0 max-w-full overflow-hidden p-0 md:block", className)}>
      {children}
    </Card>
  );
}
