/** Resultado simplificado de geocodificación inversa (Mapbox). */
export interface GeocodedAddress {
  line1: string;
  city: string | null;
  department: string | null;
  municipality: string | null;
  fullPlace: string;
}

type MapboxFeature = {
  place_name?: string;
  text?: string;
  address?: string;
  context?: Array<{ id?: string; text?: string }>;
};

/**
 * Convierte coordenadas en dirección legible (es-CO).
 * Usa el token público de Mapbox en el cliente.
 */
export async function reverseGeocode(
  lng: number,
  lat: number,
  accessToken: string,
): Promise<GeocodedAddress | null> {
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`,
  );
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("language", "es");
  url.searchParams.set("types", "address,place,locality,neighborhood");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const json = (await res.json()) as { features?: MapboxFeature[] };
  const f = json.features?.[0];
  if (!f?.place_name) return null;

  const municipality =
    f.context?.find((c) => c.id?.startsWith("place."))?.text ??
    f.context?.find((c) => c.id?.startsWith("locality."))?.text ??
    null;

  const department =
    f.context?.find((c) => c.id?.startsWith("region."))?.text ?? null;

  const street = [f.address, f.text].filter(Boolean).join(" ");
  const line1 = street || f.place_name.split(",")[0]?.trim() || f.place_name;

  return {
    line1,
    city: municipality,
    department,
    municipality,
    fullPlace: f.place_name,
  };
}
