"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";

import { formatCOP } from "@/lib/format";
import { STATUS_LABELS } from "@/modules/orders/status";
import { MapboxMap, type MapMarker } from "@/components/maps/mapbox-map";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import { haversineMeters } from "@/modules/delivery/proximity";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrderTracking } from "@/modules/tracking/queries";

const AVG_SPEED_MS = 6.9; // ~25 km/h

export function TrackClient({ tracking }: { tracking: OrderTracking }) {
  const router = useRouter();
  const supabase = useSupabaseBrowserClient();

  // Realtime: nuevas ubicaciones del repartidor refrescan el seguimiento.
  useEffect(() => {
    const channel = supabase
      .channel(`track-${tracking.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_locations",
          filter: `order_id=eq.${tracking.id}`,
        },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router, tracking.id]);

  const { courierLocation, destination } = tracking;

  const markers: MapMarker[] = [];
  if (courierLocation) {
    markers.push({
      id: "courier",
      lat: courierLocation.lat,
      lng: courierLocation.lng,
      color: "#ea580c",
      popup: tracking.courierName ?? "Repartidor",
    });
  }
  if (destination?.lat != null && destination?.lng != null) {
    markers.push({
      id: "dest",
      lat: destination.lat,
      lng: destination.lng,
      color: "#16a34a",
      popup: "Tu dirección",
    });
  }

  const route: [number, number][] | null =
    courierLocation && destination?.lat != null && destination?.lng != null
      ? [
          [courierLocation.lng, courierLocation.lat],
          [destination.lng!, destination.lat!],
        ]
      : null;

  let etaMin: number | null = null;
  if (courierLocation && destination?.lat != null && destination?.lng != null) {
    const meters = haversineMeters(courierLocation, {
      lat: destination.lat,
      lng: destination.lng,
    });
    etaMin = Math.max(1, Math.round(meters / AVG_SPEED_MS / 60));
  }

  const center: [number, number] | undefined = courierLocation
    ? [courierLocation.lng, courierLocation.lat]
    : destination?.lat != null && destination?.lng != null
      ? [destination.lng, destination.lat]
      : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Seguimiento</h2>
          <p className="text-sm text-muted-foreground">Pedido #{tracking.id.slice(0, 6)}</p>
        </div>
        <Badge>{(STATUS_LABELS as Record<string, string>)[tracking.status] ?? tracking.status}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estado
            </CardTitle>
          </CardHeader>
          <CardContent className="font-semibold">
            {(STATUS_LABELS as Record<string, string>)[tracking.status] ?? tracking.status}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ETA aprox.
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-1 font-semibold">
            <Clock className="h-4 w-4 text-orange-600" />
            {etaMin != null ? `${etaMin} min` : "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent className="font-semibold">{formatCOP(tracking.total)}</CardContent>
        </Card>
      </div>

      <div className="h-[420px] overflow-hidden rounded-xl border">
        <MapboxMap markers={markers} route={route} center={center} zoom={13} className="h-full w-full" />
      </div>

      {!courierLocation && (
        <p className="text-center text-sm text-muted-foreground">
          Aún no hay un repartidor en ruta. Verás su ubicación en vivo cuando
          salga con tu pedido.
        </p>
      )}
    </div>
  );
}
