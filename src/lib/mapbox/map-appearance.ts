import type mapboxgl from "mapbox-gl";

/** Estilo base según tema de la app (sin POIs de negocios). */
export function getPedigoMapStyle(isDark: boolean): string {
  return isDark
    ? "mapbox://styles/mapbox/dark-v11"
    : "mapbox://styles/mapbox/light-v11";
}

/**
 * Oculta etiquetas de POIs, comercios y puntos de interés de Mapbox.
 * Solo deja calles, barrios y contexto geográfico útil para ubicar direcciones.
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
    /^road-label.*-poi/,
  ];

  for (const layer of style.layers) {
    const id = layer.id;
    const isSymbol = layer.type === "symbol";
    const layout = layer.layout as { "text-field"?: unknown } | undefined;
    const textField = JSON.stringify(layout?.["text-field"] ?? "");
    const isPoi =
      hidePatterns.some((re) => re.test(id)) ||
      (isSymbol && id.includes("poi")) ||
      (isSymbol && textField.includes("poi")) ||
      (isSymbol && id.includes("dot") && id.includes("label"));

    if (!isPoi) continue;

    try {
      map.setLayoutProperty(id, "visibility", "none");
    } catch {
      /* capa no disponible en este zoom/estilo */
    }
  }
}

export function applyPedigoMapAppearance(map: mapboxgl.Map): void {
  const run = () => hideThirdPartyPoiLabels(map);
  if (map.isStyleLoaded()) run();
  else map.once("style.load", run);
}
