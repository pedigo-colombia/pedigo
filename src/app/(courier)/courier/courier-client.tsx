"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Navigation, Power } from "lucide-react";
import { toast } from "sonner";

import { formatCOP } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapboxMap, type MapMarker } from "@/components/maps/mapbox-map";
import {
  courierMarkDelivered,
  courierSetAvailability,
} from "@/modules/delivery/courier-actions";
import type { MyCourierContext } from "@/modules/delivery/courier-queries";

const PING_MS = 5000;

export function CourierClient({ context }: { context: MyCourierContext }) {
  const router = useRouter();
  const { courier, activeOrder } = context;
  const [online, setOnline] = useState(courier?.isActive ?? false);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Comparte ubicación cada 5s mientras esté en línea.
  useEffect(() => {
    if (!online || !courier) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (!("geolocation" in navigator)) {
      toast.error("Tu dispositivo no soporta geolocalización.");
      return;
    }

    const ping = () => {
      navigator.geolocation.getCurrentPosition(
        async (p) => {
          const body = {
            courierId: courier.id,
            orderId: activeOrder?.id ?? null,
            lat: p.coords.latitude,
            lng: p.coords.longitude,
            heading: p.coords.heading ?? undefined,
            speed: p.coords.speed ?? undefined,
          };
          setPos({ lat: body.lat, lng: body.lng });
          try {
            await fetch("/api/locations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
          } catch {
            /* reintenta en el próximo ciclo */
          }
        },
        () => toast.error("No se pudo obtener tu ubicación."),
        { enableHighAccuracy: true, maximumAge: 0 },
      );
    };

    ping();
    timerRef.current = setInterval(ping, PING_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [online, courier, activeOrder?.id]);

  function toggleOnline() {
    if (!courier) return;
    const next = !online;
    setOnline(next);
    startTransition(async () => {
      const res = await courierSetAvailability(next);
      if (!res.ok) {
        toast.error(res.message);
        setOnline(!next);
      } else {
        toast.success(res.message);
      }
    });
  }

  function markDelivered() {
    if (!activeOrder) return;
    startTransition(async () => {
      const res = await courierMarkDelivered(activeOrder.id);
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  if (!courier) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-base">No eres repartidor</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Tu cuenta no está registrada como repartidor. Pide a un comercio que te
          dé de alta y te vincule.
        </CardContent>
      </Card>
    );
  }

  const markers: MapMarker[] = [];
  if (pos) markers.push({ id: "me", lat: pos.lat, lng: pos.lng, color: "#ea580c", popup: "Tú" });
  if (activeOrder?.address?.lat != null && activeOrder?.address?.lng != null) {
    markers.push({
      id: "dest",
      lat: activeOrder.address.lat,
      lng: activeOrder.address.lng,
      color: "#16a34a",
      popup: "Destino",
    });
  }
  const route: [number, number][] | null =
    pos && activeOrder?.address?.lat != null && activeOrder?.address?.lng != null
      ? [
          [pos.lng, pos.lat],
          [activeOrder.address.lng!, activeOrder.address.lat!],
        ]
      : null;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Hola, {courier.fullName}</CardTitle>
          <Badge variant={online ? "default" : "secondary"}>
            {online ? "En línea" : "Desconectado"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {online
              ? "Compartiendo tu ubicación cada 5 segundos."
              : "Conéctate para recibir entregas y compartir tu ubicación."}
          </p>
          <Button
            className="w-full"
            size="lg"
            variant={online ? "outline" : "default"}
            disabled={isPending}
            onClick={toggleOnline}
          >
            <Power className="mr-2 h-4 w-4" />
            {online ? "Desconectarme" : "Conectarme"}
          </Button>
        </CardContent>
      </Card>

      {activeOrder ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Entrega activa · #{activeOrder.id.slice(0, 6)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              {activeOrder.address?.line1 ?? "Sin dirección registrada"}
            </p>
            <p className="text-sm font-medium">Total: {formatCOP(activeOrder.total)}</p>
            <div className="h-56 overflow-hidden rounded-lg border">
              <MapboxMap
                markers={markers}
                route={route}
                center={pos ? [pos.lng, pos.lat] : undefined}
                zoom={14}
                className="h-full w-full"
              />
            </div>
            <Button className="w-full" disabled={isPending} onClick={markDelivered}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Marcar entregado
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
            <Navigation className="h-6 w-6" />
            No tienes entregas asignadas por ahora.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
