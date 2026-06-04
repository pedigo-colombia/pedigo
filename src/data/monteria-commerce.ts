/**
 * Comercios de referencia en Montería (Córdoba), zona Calle 41 × Circunvalar.
 * Coordenadas aproximadas para demo/mapa.
 */
export const MONTERIA_CENTER = {
  lng: -75.87289,
  lat: 8.74758,
} as const;

export const MONTERIA_COMMERCES = [
  {
    name: "Restaurante El Corral",
    slug: "el-corral-monteria",
    prefix: "EC",
    address: "Carrera 6 #41-120, Montería",
    lat: 8.74842,
    lng: -75.87312,
    coverImage:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80",
    menuTheme: "grill" as const,
  },
  {
    name: "Archie's",
    slug: "archies-circunvalar",
    prefix: "AR",
    address: "Av. Circunvalar con Calle 41, Montería",
    lat: 8.74795,
    lng: -75.87185,
    coverImage:
      "https://images.unsplash.com/photo-1568903908542-d053c35ba1fd?w=600&q=80",
    menuTheme: "burger" as const,
  },
  {
    name: "Mamma Rosa Pizza",
    slug: "mamma-rosa-pizza",
    prefix: "MR",
    address: "Calle 41 #6-45, Montería",
    lat: 8.74722,
    lng: -75.87265,
    coverImage:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80",
    menuTheme: "pizza" as const,
  },
  {
    name: "Don Jeduario",
    slug: "don-jeduario",
    prefix: "DJ",
    address: "Calle 41 #5-28, Montería",
    lat: 8.74688,
    lng: -75.87348,
    coverImage:
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80",
    menuTheme: "criollo" as const,
  },
  {
    name: "La Granja de Jerónimo",
    slug: "la-granja-jeronimo",
    prefix: "GJ",
    address: "Av. Circunvalar #41-05, Montería",
    lat: 8.74805,
    lng: -75.87142,
    coverImage:
      "https://images.unsplash.com/photo-1598103442337-b5d686c5d725?w=600&q=80",
    menuTheme: "chicken" as const,
  },
  {
    name: "Crepes & Waffles",
    slug: "crepes-waffles-mtr",
    prefix: "CW",
    address: "Carrera 6 esquina Calle 41, Montería",
    lat: 8.74768,
    lng: -75.87402,
    coverImage:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80",
    menuTheme: "cafe" as const,
  },
  {
    name: "Pizza Bruno",
    slug: "pizza-bruno",
    prefix: "PB",
    address: "Calle 41 #6-88, Montería",
    lat: 8.74655,
    lng: -75.87218,
    coverImage:
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80",
    menuTheme: "pizza" as const,
  },
] as const;

export const COMMERCE_COVER_BY_SLUG: Record<string, string> = Object.fromEntries(
  MONTERIA_COMMERCES.map((c) => [c.slug, c.coverImage]),
);

const THEME_IMAGES: Record<
  (typeof MONTERIA_COMMERCES)[number]["menuTheme"],
  string[]
> = {
  pizza: [
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80",
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80",
  ],
  burger: [
    "https://images.unsplash.com/photo-1568903908542-d053c35ba1fd?w=400&q=80",
    "https://images.unsplash.com/photo-1550547660-d9450f1790fd?w=400&q=80",
    "https://images.unsplash.com/photo-1572802419224-296b0aaeb0b6?w=400&q=80",
  ],
  grill: [
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80",
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80",
    "https://images.unsplash.com/photo-1529042410759-befb1204b916?w=400&q=80",
  ],
  criollo: [
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80",
    "https://images.unsplash.com/photo-1604908176997-43162fdf021c?w=400&q=80",
    "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&q=80",
  ],
  chicken: [
    "https://images.unsplash.com/photo-1598103442337-b5d686c5d725?w=400&q=80",
    "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80",
    "https://images.unsplash.com/photo-1608039753135-4e81cc02260f?w=400&q=80",
  ],
  cafe: [
    "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
    "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80",
  ],
};

const MENU_NAMES: Record<(typeof MONTERIA_COMMERCES)[number]["menuTheme"], string[]> = {
  pizza: ["Pizza clásica", "Pizza especial", "Lasaña", "Calzone", "Pizza vegetariana"],
  burger: ["Hamburguesa clásica", "Doble carne", "Combo papas", "Perro caliente", "Combo soda"],
  grill: ["Parrilla mixta", "Costillas BBQ", "Churrasco", "Punta de anca", "Tabla para dos"],
  criollo: ["Bandeja paisa", "Sobrebarriga", "Mojarra frita", "Arroz con pollo", "Sancocho"],
  chicken: ["Pollo broaster", "Alitas BBQ", "Combo familiar", "Pechuga a la plancha", "Caja 8 piezas"],
  cafe: ["Crepe nutella", "Waffle frutos rojos", "Café americano", "Malteada", "Panqueques"],
};

export function productImageFor(
  theme: (typeof MONTERIA_COMMERCES)[number]["menuTheme"],
  index: number,
): string {
  const pool = THEME_IMAGES[theme];
  return pool[index % pool.length]!;
}

export function productNameFor(
  theme: (typeof MONTERIA_COMMERCES)[number]["menuTheme"],
  index: number,
): string {
  const names = MENU_NAMES[theme];
  const base = names[index % names.length]!;
  return index >= names.length ? `${base} ${Math.floor(index / names.length) + 1}` : base;
}
