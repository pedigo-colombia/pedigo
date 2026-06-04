import type mapboxgl from "mapbox-gl";

const poiApplied = new WeakMap<mapboxgl.Map, boolean>();

/** Estilo base según tema de la app (sin POIs de negocios). */
export function getPedigoMapStyle(isDark: boolean): string {
  return isDark
    ? "mapbox://styles/mapbox/dark-v11"
    : "mapbox://styles/mapbox/light-v11";
}

/**
 * Oculta etiquetas de POIs de terceros (una sola vez por carga de estilo).
 */
export function hideThirdPartyPoiLabels(map: mapboxgl.Map): void {
  const style = map.getStyle();
  if (!style?.layers) return;

  const hidePatterns = [
    /^poi-/,
    /poi-label/,
    /^transit-/,
    /^airport-/,
    /^natural-point-label/,
    /^motorway-junction/,
    /^ferry-/,
  ];

  for (const layer of style.layers) {
    const id = layer.id;
    if (layer.type !== "symbol") continue;
    const isPoi =
      hidePatterns.some((re) => re.test(id)) ||
      id.includes("poi") ||
      (id.includes("dot") && id.includes("label"));
    if (!isPoi) continue;
    try {
      map.setLayoutProperty(id, "visibility", "none");
    } catch {
      /* capa no disponible */
    }
  }
}

export function applyPedigoMapAppearance(map: mapboxgl.Map, force = false): void {
  if (!force && poiApplied.get(map)) return;
  poiApplied.set(map, true);
  hideThirdPartyPoiLabels(map);
}

export function resetPedigoMapAppearance(map: mapboxgl.Map): void {
  poiApplied.delete(map);
}
