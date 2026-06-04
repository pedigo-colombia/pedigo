"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, List, MapPin, Navigation, Search } from "lucide-react";
import { toast } from "sonner";

import { MapboxMap, type MapMarker } from "@/components/maps/mapbox-map";
import { RemoteImage } from "@/components/ui/remote-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brand } from "@/lib/brand/tokens";
import {
  formatDistanceMeters,
  haversineMeters,
} from "@/modules/delivery/proximity";
import type { CommerceDiscoveryItem } from "@/modules/orders/catalog-public";
import { cn } from "@/lib/utils";

export interface CommerceWithDistance extends CommerceDiscoveryItem {
  distanceMeters: number | null;
}

export function CommerceDiscoveryHome({
  commerces,
  userName,
  center,
  hasUserLocation,
}: {
  commerces: CommerceDiscoveryItem[];
  userName: string;
  center: [number, number];
  hasUserLocation: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [userCenter, setUserCenter] = useState<[number, number] | null>(
    hasUserLocation ? center : null,
  );
  const [locating, setLocating] = useState(false);

  const origin = userCenter ?? center;
  const mapZoom = userCenter ? 15 : 14;

  const sorted = useMemo((): CommerceWithDistance[] => {
    const q = search.trim().toLowerCase();
    return commerces
      .map((c) => ({
        ...c,
        distanceMeters: haversineMeters(
          { lat: origin[1], lng: origin[0] },
          { lat: c.lat, lng: c.lng },
        ),
      }))
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          (c.address?.toLowerCase().includes(q) ?? false),
      )
      .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
  }, [commerces, origin, search]);

  const markers = useMemo((): MapMarker[] => {
    const list: MapMarker[] = sorted.map((c) => ({
      id: c.slug,
      lng: c.lng,
      lat: c.lat,
      popup: c.name,
      color: brand.orange,
    }));
    if (userCenter) {
      list.unshift({
        id: "__user_location__",
        lng: userCenter[0],
        lat: userCenter[1],
        popup: "Tu ubicación",
        color: "#3B82F6",
      });
    }
    return list;
  }, [sorted, userCenter]);

  function useMyLocation() {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      toast.error("La ubicación solo funciona con HTTPS (o en localhost).");
      return;
    }
    if (!("geolocation" in navigator)) {
      toast.error("Tu navegador no permite geolocalización.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        setUserCenter([p.coords.longitude, p.coords.latitude]);
        toast.success("Ubicación actualizada en el mapa.");
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error(
            "Permiso denegado. Activa la ubicación para este sitio en la configuración del navegador.",
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          toast.error("No se pudo obtener tu posición. Intenta de nuevo.");
        } else {
          toast.error("Tiempo agotado al buscar tu ubicación.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30_000 },
    );
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col sm:h-[calc(100dvh-4rem)]">
      {/* Mapa: altura fija, no tapa la lista */}
      <div className="relative h-[42dvh] min-h-[220px] max-h-[420px] shrink-0 touch-none">
        <MapboxMap
          className="absolute inset-0 h-full w-full"
          markers={markers}
          center={origin}
          zoom={mapZoom}
          fitToMarkers={!userCenter && sorted.length > 0}
          followCenter
          onMarkerClick={(id) => {
            if (id === "__user_location__") return;
            router.push(`/pedir/${id}`);
          }}
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3 sm:p-4">
          <div className="pointer-events-auto mx-auto max-w-lg">
            <div className="rounded-2xl border border-border/80 bg-card/95 p-3 shadow-lg backdrop-blur-md sm:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="pedigo-kicker mb-0.5">PediGo · Montería</p>
                  <h1 className="truncate font-heading text-lg font-extrabold sm:text-xl">
                    Hola, {userName}
                  </h1>
                </div>
                <Link
                  href="/pedir"
                  className="shrink-0 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-semibold text-brand-orange hover:bg-accent"
                >
                  <List className="mr-1 inline h-3.5 w-3.5" />
                  Lista
                </Link>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar restaurante…"
                  className="h-10 pl-9"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 h-9 w-full sm:w-auto"
                disabled={locating}
                onClick={useMyLocation}
              >
                <Navigation className="mr-1.5 h-4 w-4" />
                {locating ? "Ubicando…" : "Usar mi ubicación"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista desplazable */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col rounded-t-3xl border-t border-border bg-card shadow-[0_-6px_24px_rgba(0,0,0,0.08)]",
          "dark:shadow-[0_-6px_24px_rgba(0,0,0,0.35)]",
        )}
      >
        <div className="flex shrink-0 items-center justify-center py-2">
          <div className="h-1 w-12 rounded-full bg-muted-foreground/35" />
        </div>
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 pb-2">
          <h2 className="font-heading text-base font-bold">
            Restaurantes{" "}
            <span className="font-normal text-muted-foreground">({sorted.length})</span>
          </h2>
          <Link
            href="/mis-pedidos"
            className="text-xs font-semibold text-brand-orange hover:underline"
          >
            Mis pedidos
          </Link>
        </div>
        <ul
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-20 pt-1 [-webkit-overflow-scrolling:touch] sm:pb-4"
          style={{ touchAction: "pan-y" }}
        >
          {sorted.length === 0 ? (
            <li className="px-2 py-8 text-center text-sm text-muted-foreground">
              {commerces.length === 0
                ? "Aún no hay restaurantes con ubicación. Ejecuta npm run db:seed en Supabase."
                : "No hay resultados para tu búsqueda."}
            </li>
          ) : (
            sorted.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/pedir/${c.slug}`}
                  className="mb-2 flex items-center gap-3 rounded-2xl border border-border/70 bg-background p-3 transition-colors active:bg-accent/50 hover:border-brand-orange/60 hover:bg-accent/40"
                >
                  <RemoteImage
                    src={c.coverImage ?? ""}
                    alt={c.name}
                    containerClassName="h-14 w-14 shrink-0 rounded-xl"
                    sizes="56px"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{c.name}</p>
                    {c.address && (
                      <p className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                        <span className="line-clamp-2">{c.address}</span>
                      </p>
                    )}
                    {c.distanceMeters != null && (
                      <p className="mt-1 text-xs font-medium text-brand-orange">
                        {formatDistanceMeters(c.distanceMeters)}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
