"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";
import { useResolvedDark } from "@/hooks/use-resolved-theme";
import {
  applyPedigoMapAppearance,
  getPedigoMapStyle,
} from "@/lib/mapbox/map-appearance";

export interface MapMarker {
  id: string;
  lng: number;
  lat: number;
  color?: string;
  popup?: string;
}

const BOGOTA: [number, number] = [-74.08, 4.65];

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
  const isDark = useResolvedDark();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const loadedRef = useRef(false);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!token || !containerRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: getPedigoMapStyle(isDark),
      center,
      zoom,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.on("load", () => {
      loadedRef.current = true;
      applyPedigoMapAppearance(map);
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
  }, [token, isDark]);

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
        const marker = new mapboxgl.Marker({ color: m.color ?? "#FF7A00" }).setLngLat([
          m.lng,
          m.lat,
        ]);
        if (m.popup) marker.setPopup(new mapboxgl.Popup({ offset: 24 }).setText(m.popup));
        marker.addTo(map);
        markersRef.current.set(m.id, marker);
      }
    }
    for (const [id, marker] of markersRef.current) {
      if (!seen.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }
  }, [markers]);

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
          paint: { "line-color": "#FF7A00", "line-width": 4 },
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
