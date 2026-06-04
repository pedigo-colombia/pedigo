import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface InventoryProduct {
  id: string;
  name: string;
  categoryId: string | null;
  categoryName: string | null;
  basePrice: number;
  taxRate: number;
  isFavorite: boolean;
  isActive: boolean;
  stockQty: number;
  minAlert: number;
  lowStock: boolean;
  variantsCount: number;
  extrasCount: number;
  schedulesCount: number;
}

export interface InventoryCategory {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface PromotionItem {
  id: string;
  name: string;
  type: string;
  value: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

export async function getCategories(): Promise<InventoryCategory[]> {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("product_categories")
    .select("id, name, sort_order, is_active")
    .order("sort_order");
  return ((data ?? []) as Array<Record<string, unknown>>).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    sortOrder: Number(c.sort_order ?? 0),
    isActive: Boolean(c.is_active),
  }));
}

export async function getInventoryProducts(): Promise<InventoryProduct[]> {
  const db = await createSupabaseServerClient();

  const [{ data: products }, { data: categories }, { data: inv }, { data: variants }, { data: extras }, { data: schedules }] =
    await Promise.all([
      db
        .from("products")
        .select("id, name, category_id, base_price, tax_rate, is_favorite, is_active")
        .order("name"),
      db.from("product_categories").select("id, name"),
      db.from("inventory_items").select("product_id, stock_qty, min_alert"),
      db.from("product_variants").select("product_id"),
      db.from("product_extras").select("product_id"),
      db.from("product_schedules").select("product_id"),
    ]);

  const catName = new Map(
    ((categories ?? []) as Array<Record<string, unknown>>).map((c) => [
      c.id as string,
      c.name as string,
    ]),
  );
  const invByProduct = new Map(
    ((inv ?? []) as Array<Record<string, unknown>>).map((i) => [
      i.product_id as string,
      { stock: Number(i.stock_qty ?? 0), min: Number(i.min_alert ?? 0) },
    ]),
  );
  const countBy = (rows: Array<Record<string, unknown>> | null) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) {
      const pid = r.product_id as string;
      m.set(pid, (m.get(pid) ?? 0) + 1);
    }
    return m;
  };
  const variantCount = countBy(variants as Array<Record<string, unknown>>);
  const extraCount = countBy(extras as Array<Record<string, unknown>>);
  const scheduleCount = countBy(schedules as Array<Record<string, unknown>>);

  return ((products ?? []) as Array<Record<string, unknown>>).map((p) => {
    const id = p.id as string;
    const stock = invByProduct.get(id) ?? { stock: 0, min: 0 };
    const categoryId = (p.category_id as string | null) ?? null;
    return {
      id,
      name: p.name as string,
      categoryId,
      categoryName: categoryId ? catName.get(categoryId) ?? null : null,
      basePrice: Number(p.base_price ?? 0),
      taxRate: Number(p.tax_rate ?? 0),
      isFavorite: Boolean(p.is_favorite),
      isActive: Boolean(p.is_active),
      stockQty: stock.stock,
      minAlert: stock.min,
      lowStock: stock.stock <= stock.min,
      variantsCount: variantCount.get(id) ?? 0,
      extrasCount: extraCount.get(id) ?? 0,
      schedulesCount: scheduleCount.get(id) ?? 0,
    };
  });
}

export async function getPromotions(): Promise<PromotionItem[]> {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("promotions")
    .select("id, name, type, value, is_active, starts_at, ends_at")
    .order("created_at", { ascending: false });
  return ((data ?? []) as Array<Record<string, unknown>>).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    type: p.type as string,
    value: Number(p.value ?? 0),
    isActive: Boolean(p.is_active),
    startsAt: (p.starts_at as string | null) ?? null,
    endsAt: (p.ends_at as string | null) ?? null,
  }));
}
