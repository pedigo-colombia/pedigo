"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";

export interface MapMarker {
  id: string;
  lng: number;
  lat: number;
  color?: string;
  /** Texto del popup (opcional). */
  popup?: string;
}

const BOGOTA: [number, number] = [-74.08, 4.65];

/**
 * Mapa Mapbox reutilizable.
 *
 * - Marcadores con diffing por `id` para no recrear el mapa en cada update
 *   (clave para tracking en tiempo real y costo).
 * - Línea de ruta opcional (polyline de coordenadas [lng, lat]).
 * - Si no hay token configurado, muestra un placeholder en vez de romper.
 */
export function MapboxMap({
  markers = [],
  route = null,
  center = BOGOTA,
  zoom = 11,
  className,
}: {
  markers?: MapMarker[];
  route?: [number, number][] | null;
  center?: [number, number];
  zoom?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const loadedRef = useRef(false);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Init del mapa (una sola vez).
  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center,
      zoom,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.on("load", () => {
      loadedRef.current = true;
    });
    mapRef.current = map;
    const markersMap = markersRef.current;

    return () => {
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
      markersMap.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Diffing de marcadores.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set<string>();
    for (const m of markers) {
      seen.add(m.id);
      const existing = markersRef.current.get(m.id);
      if (existing) {
        existing.setLngLat([m.lng, m.lat]);
      } else {
        const marker = new mapboxgl.Marker({ color: m.color ?? "#ea580c" }).setLngLat([
          m.lng,
          m.lat,
        ]);
        if (m.popup) marker.setPopup(new mapboxgl.Popup({ offset: 24 }).setText(m.popup));
        marker.addTo(map);
        markersRef.current.set(m.id, marker);
      }
    }
    // Remueve los que ya no están.
    for (const [id, marker] of markersRef.current) {
      if (!seen.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }
  }, [markers]);

  // Línea de ruta.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      const geojson = {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "LineString" as const,
          coordinates: route ?? [],
        },
      };
      const src = map.getSource("route") as mapboxgl.GeoJSONSource | undefined;
      if (src) {
        src.setData(geojson);
      } else if (route && route.length > 0) {
        map.addSource("route", { type: "geojson", data: geojson });
        map.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#ea580c", "line-width": 4 },
        });
      }
    };

    if (loadedRef.current) apply();
    else map.once("load", apply);
  }, [route]);

  if (!token) {
    return (
      <div
        className={
          className ??
          "flex h-full min-h-64 w-full items-center justify-center rounded-xl border bg-muted/30 text-sm text-muted-foreground"
        }
      >
        Configura NEXT_PUBLIC_MAPBOX_TOKEN para ver el mapa.
      </div>
    );
  }

  return <div ref={containerRef} className={className ?? "h-full w-full rounded-xl"} />;
}
