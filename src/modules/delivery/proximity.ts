/**
 * Utilidades de proximidad para la asignación de repartidores.
 * Distancia Haversine (metros) entre dos coordenadas.
 */
export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface CandidateCourier {
  id: string;
  lat: number | null;
  lng: number | null;
  isActive: boolean;
}

/**
 * Elige el repartidor activo más cercano a un punto. Devuelve null si no hay
 * candidatos con ubicación conocida.
 */
export function pickNearestCourier(
  origin: { lat: number; lng: number },
  candidates: CandidateCourier[],
): { id: string; distanceMeters: number } | null {
  let best: { id: string; distanceMeters: number } | null = null;
  for (const c of candidates) {
    if (!c.isActive || c.lat == null || c.lng == null) continue;
    const distanceMeters = haversineMeters(origin, { lat: c.lat, lng: c.lng });
    if (!best || distanceMeters < best.distanceMeters) {
      best = { id: c.id, distanceMeters };
    }
  }
  return best;
}
