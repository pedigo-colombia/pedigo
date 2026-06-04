"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";
import { useResolvedDark } from "@/hooks/use-resolved-theme";
import { brand } from "@/lib/brand/tokens";
import {
  applyPedigoMapAppearance,
  getPedigoMapStyle,
  resetPedigoMapAppearance,
} from "@/lib/mapbox/map-appearance";

export interface MapMarker {
  id: string;
  lng: number;
  lat: number;
  color?: string; // hex, ej. #FF7A00
  popup?: string;
}

const BOGOTA: [number, number] = [-74.08, 4.65];

export function MapboxMap({
  markers = [],
  route = null,
  center = BOGOTA,
  zoom = 11,
  className,
  fitToMarkers = false,
  followCenter = true,
  onMarkerClick,
}: {
  markers?: MapMarker[];
  route?: [number, number][] | null;
  center?: [number, number];
  zoom?: number;
  className?: string;
  /** Ajusta la cámara para mostrar todos los marcadores (ignora center/zoom inicial tras cargar). */
  fitToMarkers?: boolean;
  /** Mueve la cámara cuando cambian center/zoom (p. ej. geolocalización). */
  followCenter?: boolean;
  onMarkerClick?: (markerId: string) => void;
}) {
  const isDark = useResolvedDark();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const loadedRef = useRef(false);
  const mountedRef = useRef(false);
  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!token || !containerRef.current || mountedRef.current) return;
    mountedRef.current = true;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: getPedigoMapStyle(isDark),
      center,
      zoom,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.once("load", () => {
      loadedRef.current = true;
      applyPedigoMapAppearance(map);
    });
    mapRef.current = map;
    const markersMap = markersRef.current;

    return () => {
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
      mountedRef.current = false;
      markersMap.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const themeRef = useRef(isDark);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || themeRef.current === isDark) return;
    themeRef.current = isDark;
    resetPedigoMapAppearance(map);
    map.setStyle(getPedigoMapStyle(isDark));
    map.once("style.load", () => applyPedigoMapAppearance(map, true));
  }, [isDark]);

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
        const el = document.createElement("button");
        el.type = "button";
        const pinColor = m.color ?? brand.orange;
        el.className =
          "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-lg transition-transform hover:scale-110";
        el.style.backgroundColor = pinColor;
        el.setAttribute("aria-label", m.popup ?? "Ubicación");
        el.textContent = "P";
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onMarkerClickRef.current?.(m.id);
        });

        const marker = new mapboxgl.Marker({ element: el }).setLngLat([m.lng, m.lat]);
        if (m.popup) {
          marker.setPopup(
            new mapboxgl.Popup({ offset: 28, closeButton: false }).setText(m.popup),
          );
        }
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

    if (fitToMarkers && markers.length > 0 && loadedRef.current) {
      const bounds = new mapboxgl.LngLatBounds();
      for (const m of markers) bounds.extend([m.lng, m.lat]);
      map.fitBounds(bounds, { padding: 72, maxZoom: 15, duration: 600 });
    }
  }, [markers, fitToMarkers]);

  const centerKey = `${center[0].toFixed(5)},${center[1].toFixed(5)}`;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current || !followCenter || fitToMarkers) return;
    map.flyTo({ center, zoom, duration: 900, essential: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerKey, zoom, followCenter, fitToMarkers]);

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
          paint: { "line-color": brand.orange, "line-width": 4 },
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
