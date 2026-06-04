"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { Loader2, MapPin, Navigation } from "lucide-react";

import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { reverseGeocode } from "@/lib/mapbox/geocode";

const BOGOTA: [number, number] = [-74.08, 4.65];

export interface AddressPickerValue {
  lat: number;
  lng: number;
  line1: string;
  city: string | null;
}

export function AddressPickerMap({
  initialLat,
  initialLng,
  autoLocateOnMount = false,
  onChange,
}: {
  initialLat?: number | null;
  initialLng?: number | null;
  /** Pide permiso de ubicación al abrir (solo para direcciones nuevas). */
  autoLocateOnMount?: boolean;
  onChange: (value: AddressPickerValue) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const [hint, setHint] = useState("Toca el mapa o arrastra el pin para ubicar tu dirección.");

  const resolveAddress = useCallback(
    async (lng: number, lat: number) => {
      if (!token) return;
      setGeocoding(true);
      try {
        const geo = await reverseGeocode(lng, lat, token);
        if (geo) {
          onChangeRef.current({
            lat,
            lng,
            line1: geo.line1,
            city: geo.city,
          });
          setHint(geo.fullPlace);
        } else {
          onChangeRef.current({ lat, lng, line1: "", city: null });
          setHint("No se pudo detectar la dirección. Escríbela manualmente.");
        }
      } finally {
        setGeocoding(false);
      }
    },
    [token],
  );

  const setPosition = useCallback(
    (lng: number, lat: number, fly = false) => {
      const map = mapRef.current;
      const marker = markerRef.current;
      if (!map || !marker) return;
      marker.setLngLat([lng, lat]);
      if (fly) map.flyTo({ center: [lng, lat], zoom: 16, duration: 800 });
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => resolveAddress(lng, lat), 350);
    },
    [resolveAddress],
  );

  const useMyLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setHint("Tu navegador no permite geolocalización.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        setPosition(p.coords.longitude, p.coords.latitude, true);
      },
      () => {
        setLocating(false);
        setHint("No se pudo obtener tu ubicación. Activa el permiso o marca el pin.");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }, [setPosition]);

  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;
    const startLng = initialLng ?? BOGOTA[0];
    const startLat = initialLat ?? BOGOTA[1];

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [startLng, startLat],
      zoom: initialLat != null ? 16 : 12,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    const marker = new mapboxgl.Marker({ color: "#ea580c", draggable: true })
      .setLngLat([startLng, startLat])
      .addTo(map);

    marker.on("dragend", () => {
      const { lng, lat } = marker.getLngLat();
      setPosition(lng, lat);
    });

    map.on("click", (e) => {
      setPosition(e.lngLat.lng, e.lngLat.lat);
    });

    mapRef.current = map;
    markerRef.current = marker;

    map.on("load", () => {
      if (initialLat == null && initialLng == null && autoLocateOnMount) {
        useMyLocation();
      } else {
        resolveAddress(startLng, startLat);
      }
    });

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      marker.remove();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Solo al montar; initial coords vienen del diálogo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-xl border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
        Configura NEXT_PUBLIC_MAPBOX_TOKEN para usar el mapa.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-xl border">
        <div ref={containerRef} className="h-56 w-full sm:h-64" />
        {(geocoding || locating) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={locating}
          onClick={useMyLocation}
        >
          <Navigation className="mr-1 h-4 w-4" />
          {locating ? "Ubicando…" : "Usar mi ubicación"}
        </Button>
        <p className="flex min-w-0 flex-1 items-start gap-1 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{hint}</span>
        </p>
      </div>
    </div>
  );
}
