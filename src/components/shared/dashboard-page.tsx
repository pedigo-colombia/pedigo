import { cn } from "@/lib/utils";

/** Contenedor de páginas de panel: evita desbordamiento horizontal en móvil. */
export function DashboardPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-full min-w-0 space-y-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
