/**
 * Imágenes de la landing. Por defecto Unsplash; reemplaza con archivos en /public/landing/.
 * Ver public/landing/README.md
 */
export const landingImages = {
  hero: {
    src: "/landing/hero.jpg",
    fallback:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80",
    alt: "Restaurante con ambiente acogedor",
  },
  mapa: {
    src: "/landing/mapa-pedidos.jpg",
    fallback:
      "https://images.unsplash.com/photo-1526628953301-4e589a634a0d?w=800&q=80",
    alt: "Entrega de pedido a domicilio",
  },
  pos: {
    src: "/landing/pos-cocina.jpg",
    fallback:
      "https://images.unsplash.com/photo-1556742502-ec7ee0a097b2?w=800&q=80",
    alt: "Operación en cocina y punto de venta",
  },
} as const;
