"use client";

import { useState, useTransition } from "react";
import { MapPin, User } from "lucide-react";
import { toast } from "sonner";

import { OrderStatusBadge } from "@/components/brand/order-status-badge";
import { Button } from "@/components/ui/button";
import { formatCOP, formatDateTime } from "@/lib/format";
import { updateOrderStatus } from "@/modules/orders/actions";
import {
  CHANNEL_LABELS,
  NEXT_STATUSES,
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
      <div className="pedigo-card py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Aún no hay pedidos. Registra una venta en el POS o recibe pedidos por la app.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {orders.map((o) => {
        const next = NEXT_STATUSES[o.status] ?? [];
        const isDelivery = Boolean(o.addressLine);
        return (
          <article key={o.id} className="pedigo-card p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <OrderStatusBadge status={o.status} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {CHANNEL_LABELS[o.channel]}
                  </span>
                </div>
                <div>
                  <p className="font-heading text-base font-bold">
                    Pedido #{o.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(o.createdAt)} · {o.itemCount} ítems
                  </p>
                </div>
                {(o.customerName || o.addressLine) && (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {o.customerName && (
                      <p className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        {o.customerName}
                      </p>
                    )}
                    {o.addressLine && (
                      <p className="flex items-start gap-1.5">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {o.addressLine}
                      </p>
                    )}
                  </div>
                )}
                {!isDelivery && o.channel !== "pos" && (
                  <p className="text-xs text-muted-foreground">Recoger en local</p>
                )}
              </div>
              <p className="font-heading text-xl font-bold text-brand-navy dark:text-foreground">
                {formatCOP(o.total)}
              </p>
            </div>

            {next.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border/70 pt-4">
                {next.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={s === "entregado" || s === "listo" ? "success" : "outline"}
                    disabled={isPending && pendingId === o.id}
                    onClick={() => changeStatus(o.id, s)}
                  >
                    {STATUS_LABELS[s]}
                  </Button>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
