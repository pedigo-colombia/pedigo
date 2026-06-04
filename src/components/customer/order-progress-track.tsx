"use client";

import Link from "next/link";
import { Check, ChefHat, Package, ShoppingBag, Truck } from "lucide-react";

import { OrderStatusBadge } from "@/components/brand/order-status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCOP } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  CUSTOMER_TRACKING_STEPS,
  getCustomerOrderProgress,
} from "@/modules/orders/status";
import type { OrderStatus } from "@/types/database";

const STEP_ICONS = [ShoppingBag, ChefHat, Package, Truck, Check] as const;

const TRACKABLE: OrderStatus[] = ["listo", "en_camino"];

export interface CustomerOrderCardItem {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  commerceName?: string | null;
}

export function CustomerOrdersList({ orders }: { orders: CustomerOrderCardItem[] }) {
  if (orders.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <ShoppingBag className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-muted-foreground">Todavía no tienes pedidos.</p>
        <Link href="/pedir">
          <Button variant="default" type="button">
            Explorar restaurantes
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((o) => (
        <li key={o.id}>
          <OrderProgressCard order={o} />
        </li>
      ))}
    </ul>
  );
}

function OrderProgressCard({ order }: { order: CustomerOrderCardItem }) {
  const progress = getCustomerOrderProgress(order.status);
  const status = order.status as OrderStatus;
  const date = new Date(order.createdAt).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-start justify-between gap-3 border-b border-border/60 bg-muted/30 px-4 py-3">
        <div>
          <p className="font-heading text-sm font-bold">
            Pedido #{order.id.slice(0, 6).toUpperCase()}
          </p>
          {order.commerceName && (
            <p className="text-xs text-muted-foreground">{order.commerceName}</p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">{date}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-brand-orange">{formatCOP(order.total)}</p>
          <OrderStatusBadge status={status} className="mt-1" />
        </div>
      </div>

      <div className="px-4 py-4">
        {progress.terminal ? (
          <p className="text-center text-sm text-muted-foreground">
            Estado: {progress.terminalLabel}
          </p>
        ) : (
          <>
            <div className="relative mb-6 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-orange to-[#ffb347] transition-[width] duration-700 ease-out"
                style={{ width: `${progress.percent}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 w-1/3 animate-pulse rounded-full bg-white/25"
                style={{ width: `${Math.min(progress.percent, 100)}%` }}
                aria-hidden
              />
            </div>

            <ol className="grid grid-cols-5 gap-1">
              {CUSTOMER_TRACKING_STEPS.map((step, i) => {
                const done = i < progress.stepIndex;
                const active = i === progress.stepIndex;
                const Icon = STEP_ICONS[i] ?? Check;
                return (
                  <li key={step.status} className="flex flex-col items-center text-center">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-500",
                        done && "border-brand-orange bg-brand-orange text-white",
                        active &&
                          "border-brand-orange bg-accent text-brand-orange shadow-md ring-4 ring-brand-orange/20 animate-[pulse_2s_ease-in-out_infinite]",
                        !done &&
                          !active &&
                          "border-border bg-card text-muted-foreground",
                      )}
                    >
                      {done ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Icon className={cn("h-4 w-4", active && "scale-110")} />
                      )}
                    </div>
                    <span
                      className={cn(
                        "mt-1.5 text-[10px] font-semibold leading-tight sm:text-xs",
                        active ? "text-brand-orange" : "text-muted-foreground",
                      )}
                    >
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </>
        )}

        {TRACKABLE.includes(status) && (
          <div className="mt-4 flex justify-center">
            <Link href={`/track/${order.id}`}>
              <Button variant="default" size="sm" type="button">
                <Truck className="mr-1.5 h-4 w-4" />
                Seguir en vivo
              </Button>
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
}
