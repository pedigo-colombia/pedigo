"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { formatCOP, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updateOrderStatus } from "@/modules/orders/actions";
import {
  CHANNEL_LABELS,
  NEXT_STATUSES,
  STATUS_CLASSES,
  STATUS_LABELS,
} from "@/modules/orders/status";
import type { OrderListItem } from "@/modules/orders/queries";

export function OrdersClient({ orders }: { orders: OrderListItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function changeStatus(orderId: string, toStatus: string) {
    setPendingId(orderId);
    startTransition(async () => {
      const res = await updateOrderStatus({
        orderId,
        toStatus: toStatus as never,
      });
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
      setPendingId(null);
    });
  }

  if (orders.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Aún no hay pedidos. Registra una venta en el POS.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const next = NEXT_STATUSES[o.status] ?? [];
        return (
          <Card key={o.id} className="flex flex-wrap items-center gap-4 p-4">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                STATUS_CLASSES[o.status],
              )}
            >
              {STATUS_LABELS[o.status]}
            </span>
            <div className="min-w-40">
              <p className="text-sm font-medium">
                #{o.id.slice(0, 8)} · {CHANNEL_LABELS[o.channel]}
              </p>
              <p className="text-xs text-muted-foreground">
                {o.itemCount} ítems · {formatDateTime(o.createdAt)}
              </p>
            </div>
            <span className="font-semibold">{formatCOP(o.total)}</span>
            <div className="ml-auto flex flex-wrap gap-2">
              {next.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant="outline"
                  disabled={isPending && pendingId === o.id}
                  onClick={() => changeStatus(o.id, s)}
                >
                  {STATUS_LABELS[s]}
                </Button>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
