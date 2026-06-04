import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_CLASSES } from "@/modules/orders/status";
import type { OrderStatus } from "@/types/database";

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STATUS_CLASSES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
