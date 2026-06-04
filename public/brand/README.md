# Assets de marca PediGo

Coloca aquí los archivos oficiales exportados desde la guía de marca. La app los referencia desde `src/lib/brand/assets.ts`.

## Archivos requeridos

| Archivo | Uso en la app | Formato | Resolución / tamaño |
|---------|---------------|---------|---------------------|
| `pedigo-isotipo.svg` | Header, favicon vectorial, fallback logo | **SVG** | Arte en viewBox cuadrado; trazo limpio |
| `pedigo-isotipo.png` | `PedigoLogo`, PWA pequeña | **PNG** transparente | **512×512** px (se escala en UI) |
| `pedigo-logo-light.svg` | Logo completo (isotipo + texto) en fondos claros | **SVG** | Ancho ~**240–320** px — **no** combinar con `pedigo-isotipo` en la misma fila |
| `pedigo-logo-dark.svg` | Logo completo en modo oscuro | **SVG** | Misma proporción que light |
| `pedigo-og.png` | Compartir en redes / metadata *(opcional)* | **PNG** | **1200×630** px — si falta, la app usa `pedigo-icon-512.png` |
| `pedigo-icon-512.png` | PWA / instalable / OG temporal | **PNG** transparente | **512×512** px |
| `pedigo-map-pin.svg` | Pin personalizado en mapa *(opcional)* | **SVG** | ~**48×64** px — si falta, pin naranja por defecto |

## Archivos opcionales (marketing)

| Archivo | Uso | Formato | Tamaño sugerido |
|---------|-----|---------|-----------------|
| `pedigo-logo-light.png` | Email / PDF | PNG | 800×200 px aprox. |
| `pedigo-logo-dark.png` | Presentaciones dark | PNG | 800×200 px |
| `pedigo-pattern.svg` | Fondos decorativos | SVG | Tile repetible |
| `pedigo-hero.jpg` | Banners app / web | JPG o WebP | 1920×1080 px, &lt; 400 KB |

## Colores de referencia

- Naranja primario: `#FF7A00`
- Azul oscuro / texto: `#1F2937`
- Verde éxito: `#4CAF50`
- Fondo app claro: `#F9FAFB`

## Notas

- Preferir **SVG** para logos en interfaz (nitidez en cualquier DPI).
- PNG solo cuando haya degradados o fotografía.
- No subir variantes con fondos distintos al nombre del archivo (usar `*-light` / `*-dark`).
- Tras agregar archivos, reinicia `npm run dev` si el logo no aparece de inmediato.
