/**
 * Imágenes de la landing (Unsplash). Opcional: reemplazar con archivos en /public/landing/.
 * Ver public/landing/README.md
 */
export const landingImages = {
  hero: {
    /** URL principal (siempre visible sin archivos locales). */
    src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400&q=85",
    local: "/landing/hero.jpg",
    alt: "Restaurante con ambiente acogedor",
  },
  mapa: {
    src: "https://images.unsplash.com/photo-1607083207639-9b46259a3f22?w=1000&q=85",
    local: "/landing/mapa-pedidos.jpg",
    alt: "Repartidor con pedido a domicilio",
  },
  pos: {
    src: "https://images.unsplash.com/photo-1556742502-ec7ee0a097b2?w=1000&q=85",
    local: "/landing/pos-cocina.jpg",
    alt: "Cocina y operación de restaurante",
  },
} as const;
