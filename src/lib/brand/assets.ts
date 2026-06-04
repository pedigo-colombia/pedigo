/**
 * Rutas de assets de marca en /public/brand/.
 * Ver public/brand/README.md para especificaciones de exportación.
 */
export const brandAssets = {
  /** Isotipo vectorial (preferido en UI). */
  isotipo: "/brand/pedigo-isotipo.svg",
  /** Isotipo raster (favicon / PWA). */
  isotipoPng: "/brand/pedigo-isotipo.png",
  /** Logo horizontal fondo claro. */
  logoLight: "/brand/pedigo-logo-light.svg",
  /** Logo horizontal fondo oscuro. */
  logoDark: "/brand/pedigo-logo-dark.svg",
  /** Open Graph (opcional; si falta, usar icon512). */
  og: "/brand/pedigo-og.png",
  /** Icono PWA 512×512. */
  icon512: "/brand/pedigo-icon-512.png",
  /** Marcador mapa personalizado (opcional). */
  mapPin: "/brand/pedigo-map-pin.svg",
} as const;
