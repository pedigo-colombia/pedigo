/** Tipos del catálogo POS (vista de dominio). */

export interface CatalogVariant {
  id: string;
  name: string;
  priceDelta: number;
}

export interface CatalogExtra {
  id: string;
  name: string;
  price: number;
}

export interface CatalogProduct {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  basePrice: number;
  taxRate: number;
  isFavorite: boolean;
  imageUrl: string | null;
  variants: CatalogVariant[];
  extras: CatalogExtra[];
}

export interface CatalogCategory {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Catalog {
  categories: CatalogCategory[];
  products: CatalogProduct[];
}

/** Línea de carrito que viaja del cliente al servidor. */
export interface CartLineInput {
  productId: string;
  variantId: string | null;
  quantity: number;
  extraIds: string[];
}
