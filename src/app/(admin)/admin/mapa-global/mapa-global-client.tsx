"use client";

import { useMemo, useState } from "react";

import { MapboxMap, type MapMarker } from "@/components/maps/mapbox-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  GlobalMapCommerce,
  GlobalMapCourier,
  GlobalMapOrder,
} from "@/modules/admin/queries";

export function MapaGlobalClient({
  commerces,
  couriers,
  orders,
}: {
  commerces: GlobalMapCommerce[];
  couriers: GlobalMapCourier[];
  orders: GlobalMapOrder[];
}) {
  const [showCommerces, setShowCommerces] = useState(true);
  const [showCouriers, setShowCouriers] = useState(true);
  const [showOrders, setShowOrders] = useState(true);

  const markers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = [];
    if (showCommerces) {
      for (const c of commerces) {
        list.push({
          id: `commerce-${c.id}`,
          lat: c.lat,
          lng: c.lng,
          color: "#2563eb",
          popup: `Comercio: ${c.name}`,
        });
      }
    }
    if (showCouriers) {
      for (const c of couriers) {
        list.push({
          id: `courier-${c.id}`,
          lat: c.lat,
          lng: c.lng,
          color: "#ea580c",
          popup: `${c.fullName} (${c.orgName})`,
        });
      }
    }
    if (showOrders) {
      for (const o of orders) {
        list.push({
          id: `order-${o.id}`,
          lat: o.lat,
          lng: o.lng,
          color: "#16a34a",
          popup: `Pedido #${o.id.slice(0, 6)} · ${o.orgName}`,
        });
      }
    }
    return list;
  }, [commerces, couriers, orders, showCommerces, showCouriers, showOrders]);

  const center: [number, number] | undefined =
    markers.length > 0 ? [markers[0].lng, markers[0].lat] : [-74.05, 4.65];

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Mapa global</h2>
          <p className="text-sm text-muted-foreground">
            Todos los comercios, repartidores activos y pedidos en despacho.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{commerces.length} comercios</Badge>
          <Badge variant="secondary">{couriers.length} repartidores</Badge>
          <Badge variant="secondary">{orders.length} pedidos activos</Badge>
          <Button
            size="sm"
            variant={showCommerces ? "default" : "outline"}
            onClick={() => setShowCommerces((v) => !v)}
          >
            Comercios
          </Button>
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
        <MapboxMap markers={markers} center={center} zoom={11} className="h-full w-full" />
      </div>
    </div>
  );
}
