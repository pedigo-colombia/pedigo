import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Catalog,
  CatalogExtra,
  CatalogProduct,
  CatalogVariant,
} from "./types";

/**
 * Carga el catálogo del comercio activo. RLS asegura que solo se devuelven
 * datos de la organización del usuario.
 */
export async function getCatalog(): Promise<Catalog> {
  const db = await createSupabaseServerClient();

  const [{ data: categories }, { data: products }, { data: variants }, { data: extras }] =
    await Promise.all([
      db
        .from("product_categories")
        .select("id, name, sort_order")
        .eq("is_active", true)
        .order("sort_order"),
      db
        .from("products")
        .select(
          "id, category_id, name, description, base_price, tax_rate, is_favorite, image_url",
        )
        .eq("is_active", true)
        .order("name"),
      db.from("product_variants").select("id, product_id, name, price_delta"),
      db.from("product_extras").select("id, product_id, name, price").eq("is_active", true),
    ]);

  const variantsByProduct = new Map<string, CatalogVariant[]>();
  for (const v of (variants ?? []) as Array<Record<string, unknown>>) {
    const pid = v.product_id as string;
    const list = variantsByProduct.get(pid) ?? [];
    list.push({
      id: v.id as string,
      name: v.name as string,
      priceDelta: Number(v.price_delta ?? 0),
    });
    variantsByProduct.set(pid, list);
  }

  const extrasByProduct = new Map<string, CatalogExtra[]>();
  for (const e of (extras ?? []) as Array<Record<string, unknown>>) {
    const pid = e.product_id as string;
    const list = extrasByProduct.get(pid) ?? [];
    list.push({
      id: e.id as string,
      name: e.name as string,
      price: Number(e.price ?? 0),
    });
    extrasByProduct.set(pid, list);
  }

  const mappedProducts: CatalogProduct[] = (
    (products ?? []) as Array<Record<string, unknown>>
  ).map((p) => ({
    id: p.id as string,
    categoryId: (p.category_id as string | null) ?? null,
    name: p.name as string,
    description: (p.description as string | null) ?? null,
    basePrice: Number(p.base_price ?? 0),
    taxRate: Number(p.tax_rate ?? 0.19),
    isFavorite: Boolean(p.is_favorite),
    imageUrl: (p.image_url as string | null) ?? null,
    variants: variantsByProduct.get(p.id as string) ?? [],
    extras: extrasByProduct.get(p.id as string) ?? [],
  }));

  return {
    categories: ((categories ?? []) as Array<Record<string, unknown>>).map((c) => ({
      id: c.id as string,
      name: c.name as string,
      sortOrder: Number(c.sort_order ?? 0),
    })),
    products: mappedProducts,
  };
}
