"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { MapboxMap, type MapMarker } from "@/components/maps/mapbox-map";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  CommercePoint,
  CourierItem,
  DeliveryOrder,
} from "@/modules/delivery/queries";

export function MapaClient({
  commerce,
  couriers,
  orders,
}: {
  commerce: CommercePoint | null;
  couriers: CourierItem[];
  orders: DeliveryOrder[];
}) {
  const router = useRouter();
  const supabase = useSupabaseBrowserClient();
  const [showCouriers, setShowCouriers] = useState(true);
  const [showOrders, setShowOrders] = useState(true);

  // Realtime: cambios de ubicación de repartidores refrescan el mapa.
  useEffect(() => {
    const channel = supabase
      .channel("mapa-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_locations" },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  const markers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = [];
    if (commerce?.lat != null && commerce?.lng != null) {
      list.push({
        id: "commerce",
        lat: commerce.lat,
        lng: commerce.lng,
        color: "#2563eb",
        popup: commerce.name,
      });
    }
    if (showCouriers) {
      for (const c of couriers) {
        if (c.lat != null && c.lng != null) {
          list.push({
            id: `courier-${c.id}`,
            lat: c.lat,
            lng: c.lng,
            color: c.isActive ? "#ea580c" : "#9ca3af",
            popup: `Repartidor: ${c.fullName}`,
          });
        }
      }
    }
    if (showOrders) {
      for (const o of orders) {
        if (o.address?.lat != null && o.address?.lng != null) {
          list.push({
            id: `order-${o.id}`,
            lat: o.address.lat,
            lng: o.address.lng,
            color: "#16a34a",
            popup: `Pedido #${o.id.slice(0, 6)}`,
          });
        }
      }
    }
    return list;
  }, [commerce, couriers, orders, showCouriers, showOrders]);

  const center: [number, number] | undefined =
    commerce?.lat != null && commerce?.lng != null
      ? [commerce.lng, commerce.lat]
      : undefined;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Mapa operativo</h2>
          <p className="text-sm text-muted-foreground">
            Comercio, repartidores y pedidos activos en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{couriers.length} repartidores</Badge>
          <Badge variant="secondary">{orders.length} pedidos activos</Badge>
          <Button
            size="sm"
            variant={showCouriers ? "default" : "outline"}
            onClick={() => setShowCouriers((v) => !v)}
          >
            Repartidores
          </Button>
          <Button
            size="sm"
            variant={showOrders ? "default" : "outline"}
            onClick={() => setShowOrders((v) => !v)}
          >
            Pedidos
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden rounded-xl border">
        <MapboxMap markers={markers} center={center} zoom={12} className="h-full w-full" />
      </div>
    </div>
  );
}
