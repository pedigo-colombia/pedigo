"use client";

import Link from "next/link";
import { MapPin, Store } from "lucide-react";

import { PageHeader } from "@/components/brand/page-header";
import { RemoteImage } from "@/components/ui/remote-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceMeters, haversineMeters } from "@/modules/delivery/proximity";
import type { CommerceDiscoveryItem } from "@/modules/orders/catalog-public";

export function PedirCommercesList({
  commerces,
  center,
}: {
  commerces: CommerceDiscoveryItem[];
  center: [number, number];
}) {
  const sorted = [...commerces]
    .map((c) => ({
      ...c,
      distanceMeters: haversineMeters(
        { lat: center[1], lng: center[0] },
        { lat: c.lat, lng: c.lng },
      ),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      <PageHeader
        kicker="Pedir"
        title="Restaurantes disponibles"
        description="Elige un comercio y arma tu pedido. Para ver el mapa, ve a Inicio."
      />

      {sorted.length === 0 ? (
        <p className="rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          No hay restaurantes disponibles en este momento.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map((c) => (
            <Link key={c.id} href={`/pedir/${c.slug}`}>
              <Card className="h-full overflow-hidden transition-colors hover:border-brand-orange/60 hover:shadow-md">
                {c.coverImage ? (
                  <RemoteImage
                    src={c.coverImage}
                    alt={c.name}
                    containerClassName="aspect-[2/1] w-full"
                    sizes="(max-width: 640px) 100vw, 400px"
                  />
                ) : null}
                <CardHeader className="flex flex-row items-center gap-3">
                  {!c.coverImage ? (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-orange/15 text-brand-orange">
                      <Store className="h-5 w-5" />
                    </div>
                  ) : null}
                  <div className="min-w-0">
                    <CardTitle className="text-base">{c.name}</CardTitle>
                    {c.address && (
                      <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                        <span className="line-clamp-2">{c.address}</span>
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm font-semibold text-brand-orange">
                    {formatDistanceMeters(c.distanceMeters)}
                  </p>
                  <p className="text-xs text-muted-foreground">Ver menú →</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
