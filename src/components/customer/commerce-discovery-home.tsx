"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, MapPin, Navigation, Search, Store } from "lucide-react";

import { MapboxMap } from "@/components/maps/mapbox-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brand } from "@/lib/brand/tokens";
import {
  formatDistanceMeters,
  haversineMeters,
} from "@/modules/delivery/proximity";
import type { CommerceDiscoveryItem } from "@/modules/orders/catalog-public";
import { cn } from "@/lib/utils";

const BOGOTA: [number, number] = [-74.08, 4.65];

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

  const markers = useMemo(
    () =>
      sorted.map((c) => ({
        id: c.slug,
        lng: c.lng,
        lat: c.lat,
        popup: c.name,
        color: brand.orange,
      })),
    [sorted],
  );

  function useMyLocation() {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        setUserCenter([p.coords.longitude, p.coords.latitude]);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 top-16 z-0 flex flex-col">
      <div className="relative min-h-0 flex-1">
        <MapboxMap
          className="absolute inset-0 h-full w-full"
          markers={markers}
          center={origin}
          zoom={13}
          fitToMarkers={sorted.length > 1 && !userCenter}
          onMarkerClick={(slug) => router.push(`/pedir/${slug}`)}
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3 sm:p-4">
          <div className="pointer-events-auto mx-auto max-w-lg space-y-2">
            <div className="rounded-2xl border border-border/80 bg-card/95 p-4 shadow-lg backdrop-blur-md">
              <p className="pedigo-kicker mb-0.5">PediGo cerca de ti</p>
              <h1 className="font-heading text-xl font-extrabold tracking-tight sm:text-2xl">
                Hola, {userName}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Elige un restaurante en el mapa o en la lista
              </p>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar restaurante…"
                  className="h-11 pl-9"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 w-full sm:w-auto"
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

      <div
        className={cn(
          "z-20 flex max-h-[min(48vh,420px)] shrink-0 flex-col rounded-t-3xl border-t border-border bg-card shadow-[0_-8px_30px_rgba(0,0,0,0.12)]",
          "dark:shadow-[0_-8px_30px_rgba(0,0,0,0.45)]",
        )}
      >
        <div className="flex items-center justify-center py-2">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex items-center justify-between border-b border-border/60 px-4 pb-2">
          <h2 className="font-heading text-base font-bold">
            Restaurantes{" "}
            <span className="font-normal text-muted-foreground">
              ({sorted.length})
            </span>
          </h2>
          <Link
            href="/mis-pedidos"
            className="text-xs font-semibold text-brand-orange hover:underline"
          >
            Mis pedidos
          </Link>
        </div>
        <ul className="flex-1 overflow-y-auto px-3 pb-24 sm:pb-4">
          {sorted.length === 0 ? (
            <li className="px-2 py-8 text-center text-sm text-muted-foreground">
              {commerces.length === 0
                ? "Aún no hay restaurantes con ubicación en el mapa."
                : "No hay resultados para tu búsqueda."}
            </li>
          ) : (
            sorted.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/pedir/${c.slug}`}
                  className="mb-2 flex items-center gap-3 rounded-2xl border border-border/70 bg-background p-3 transition-colors hover:border-brand-orange/60 hover:bg-accent/40"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-orange/15 text-brand-orange">
                    <Store className="h-6 w-6" />
                  </div>
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
