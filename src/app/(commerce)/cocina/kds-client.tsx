"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { CHANNEL_LABELS } from "@/modules/orders/status";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import { updateOrderStatus } from "@/modules/orders/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OrderListItem } from "@/modules/orders/queries";
import type { OrderStatus } from "@/types/database";

const COLUMNS: { status: OrderStatus; title: string; next: OrderStatus; nextLabel: string }[] = [
  { status: "recibido", title: "Recibidos", next: "en_preparacion", nextLabel: "Preparar" },
  { status: "en_preparacion", title: "En preparación", next: "listo", nextLabel: "Marcar listo" },
  { status: "listo", title: "Listos", next: "en_camino", nextLabel: "Despachar" },
];

function minutesSince(iso: string, now: number): number {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
}

export function KdsClient({ initialOrders }: { initialOrders: OrderListItem[] }) {
  const router = useRouter();
  const supabase = useSupabaseBrowserClient();
  const [now, setNow] = useState(() => Date.now());
  const [connected, setConnected] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Reloj para el tiempo transcurrido.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  // Suscripción Realtime: cualquier cambio en pedidos refresca la pantalla.
  useEffect(() => {
    const channel = supabase
      .channel("kds-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => router.refresh(),
      )
      .subscribe((status) => setConnected(String(status) === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  function advance(orderId: string, to: OrderStatus) {
    startTransition(async () => {
      const res = await updateOrderStatus({ orderId, toStatus: to });
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cocina (KDS)</h2>
          <p className="text-sm text-muted-foreground">
            Tickets en vivo. Avanza el estado al terminar cada paso.
          </p>
        </div>
        <Badge variant={connected ? "default" : "secondary"} className="gap-1">
          {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {connected ? "En vivo" : "Conectando…"}
        </Badge>
      </div>

      <div className="grid flex-1 gap-4 overflow-hidden md:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = initialOrders.filter((o) => o.status === col.status);
          return (
            <div key={col.status} className="flex flex-col rounded-xl border bg-muted/20">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <span className="font-semibold">{col.title}</span>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              <div className="flex-1 space-y-3 overflow-auto p-3">
                {items.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Sin tickets.
                  </p>
                ) : (
                  items.map((o) => {
                    const mins = minutesSince(o.createdAt, now);
                    const urgent = mins >= 15;
                    return (
                      <div
                        key={o.id}
                        className={cn(
                          "rounded-lg border bg-background p-3 shadow-sm",
                          urgent && "border-red-300",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-medium">
                            #{o.id.slice(0, 6)}
                          </span>
                          <span
                            className={cn(
                              "flex items-center gap-1 text-xs",
                              urgent ? "font-semibold text-red-600" : "text-muted-foreground",
                            )}
                          >
                            <Clock className="h-3 w-3" /> {mins} min
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">{CHANNEL_LABELS[o.channel]}</Badge>
                          <span>{o.itemCount} ítems</span>
                        </div>
                        <Button
                          size="sm"
                          className="mt-3 w-full"
                          disabled={isPending}
                          onClick={() => advance(o.id, col.next)}
                        >
                          {col.nextLabel}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
