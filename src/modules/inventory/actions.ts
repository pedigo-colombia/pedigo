"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrg, requirePermission } from "@/modules/auth/guards";
import {
  categorySchema,
  extraSchema,
  productSchema,
  promotionSchema,
  scheduleSchema,
  stockAdjustSchema,
  updateProductSchema,
  variantSchema,
} from "./schema";

export interface InventoryActionResult {
  ok: boolean;
  message: string;
}

function fail(message: string): InventoryActionResult {
  return { ok: false, message };
}

export async function createProduct(
  input: unknown,
): Promise<InventoryActionResult> {
  await requirePermission("inventory.manage");
  const org = await requireOrg();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const d = parsed.data;

  const db = await createSupabaseServerClient();
  const { data: product, error } = await db
    .from("products")
    .insert({
      organization_id: org.organizationId,
      category_id: d.categoryId ?? null,
      name: d.name,
      base_price: d.basePrice,
      tax_rate: d.taxRate,
      is_favorite: d.isFavorite,
      is_active: d.isActive,
    } as never)
    .select("id")
    .single();

  if (error || !product) return fail(error?.message ?? "No se pudo crear el producto");
  const productId = (product as { id: string }).id;

  await db.from("inventory_items").insert({
    organization_id: org.organizationId,
    product_id: productId,
    stock_qty: d.initialStock,
    min_alert: d.minAlert,
  } as never);

  if (d.initialStock > 0) {
    await db.from("inventory_movements").insert({
      organization_id: org.organizationId,
      inventory_item_id: null,
      type: "in",
      qty: d.initialStock,
      reason: "Stock inicial",
    } as never);
  }

  revalidatePath("/inventario");
  return { ok: true, message: "Producto creado." };
}

export async function updateProduct(
  input: unknown,
): Promise<InventoryActionResult> {
  await requirePermission("inventory.manage");
  await requireOrg();
  const parsed = updateProductSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const { id, minAlert, ...rest } = parsed.data;

  const db = await createSupabaseServerClient();
  const patch: Record<string, unknown> = {};
  if (rest.name !== undefined) patch.name = rest.name;
  if (rest.categoryId !== undefined) patch.category_id = rest.categoryId;
  if (rest.basePrice !== undefined) patch.base_price = rest.basePrice;
  if (rest.taxRate !== undefined) patch.tax_rate = rest.taxRate;
  if (rest.isFavorite !== undefined) patch.is_favorite = rest.isFavorite;
  if (rest.isActive !== undefined) patch.is_active = rest.isActive;

  if (Object.keys(patch).length > 0) {
    const { error } = await db.from("products").update(patch as never).eq("id", id);
    if (error) return fail(error.message);
  }
  if (minAlert !== undefined) {
    await db.from("inventory_items").update({ min_alert: minAlert } as never).eq("product_id", id);
  }

  revalidatePath("/inventario");
  return { ok: true, message: "Producto actualizado." };
}

export async function adjustStock(input: unknown): Promise<InventoryActionResult> {
  await requirePermission("inventory.manage");
  const org = await requireOrg();
  const parsed = stockAdjustSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const d = parsed.data;

  const db = await createSupabaseServerClient();
  const { data: item } = await db
    .from("inventory_items")
    .select("id, stock_qty")
    .eq("product_id", d.productId)
    .maybeSingle();

  let itemId = (item as { id: string } | null)?.id ?? null;
  let current = Number((item as { stock_qty?: number } | null)?.stock_qty ?? 0);

  if (!itemId) {
    const { data: created } = (await db
      .from("inventory_items")
      .insert({ organization_id: org.organizationId, product_id: d.productId, stock_qty: 0 } as never)
      .select("id")
      .single()) as { data: { id: string } | null };
    itemId = created?.id ?? null;
    current = 0;
  }
  if (!itemId) return fail("No se pudo localizar el inventario.");

  const next =
    d.type === "in" ? current + d.qty : d.type === "out" ? current - d.qty : d.qty;

  await db.from("inventory_items").update({ stock_qty: next } as never).eq("id", itemId);
  await db.from("inventory_movements").insert({
    organization_id: org.organizationId,
    inventory_item_id: itemId,
    type: d.type,
    qty: d.qty,
    reason: d.reason ?? null,
  } as never);

  revalidatePath("/inventario");
  return { ok: true, message: "Stock actualizado." };
}

export async function createCategory(input: unknown): Promise<InventoryActionResult> {
  await requirePermission("inventory.manage");
  const org = await requireOrg();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos");

  const db = await createSupabaseServerClient();
  const { error } = await db.from("product_categories").insert({
    organization_id: org.organizationId,
    name: parsed.data.name,
    sort_order: parsed.data.sortOrder,
  } as never);
  if (error) return fail(error.message);
  revalidatePath("/inventario");
  return { ok: true, message: "Categoría creada." };
}

export async function createPromotion(input: unknown): Promise<InventoryActionResult> {
  await requirePermission("inventory.manage");
  const org = await requireOrg();
  const parsed = promotionSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const d = parsed.data;

  const db = await createSupabaseServerClient();
  const { error } = await db.from("promotions").insert({
    organization_id: org.organizationId,
    name: d.name,
    type: d.type,
    value: d.value,
    starts_at: d.startsAt ?? null,
    ends_at: d.endsAt ?? null,
    is_active: d.isActive,
  } as never);
  if (error) return fail(error.message);
  revalidatePath("/inventario");
  return { ok: true, message: "Promoción creada." };
}

export async function setPromotionActive(
  promotionId: string,
  isActive: boolean,
): Promise<InventoryActionResult> {
  await requirePermission("inventory.manage");
  await requireOrg();
  const db = await createSupabaseServerClient();
  const { error } = await db
    .from("promotions")
    .update({ is_active: isActive } as never)
    .eq("id", promotionId);
  if (error) return fail(error.message);
  revalidatePath("/inventario");
  return { ok: true, message: isActive ? "Promoción activada." : "Promoción desactivada." };
}

export async function addSchedule(input: unknown): Promise<InventoryActionResult> {
  await requirePermission("inventory.manage");
  const org = await requireOrg();
  const parsed = scheduleSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const d = parsed.data;

  const db = await createSupabaseServerClient();
  const { error } = await db.from("product_schedules").insert({
    organization_id: org.organizationId,
    product_id: d.productId,
    day_of_week: d.dayOfWeek,
    start_time: d.startTime,
    end_time: d.endTime,
  } as never);
  if (error) return fail(error.message);
  revalidatePath("/inventario");
  return { ok: true, message: "Horario agregado." };
}

export async function addVariant(input: unknown): Promise<InventoryActionResult> {
  await requirePermission("inventory.manage");
  const org = await requireOrg();
  const parsed = variantSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const d = parsed.data;

  const db = await createSupabaseServerClient();
  const { error } = await db.from("product_variants").insert({
    organization_id: org.organizationId,
    product_id: d.productId,
    name: d.name,
    price_delta: d.priceDelta,
    sku: d.sku ?? null,
  } as never);
  if (error) return fail(error.message);
  revalidatePath("/inventario");
  return { ok: true, message: "Variante agregada." };
}

export async function addExtra(input: unknown): Promise<InventoryActionResult> {
  await requirePermission("inventory.manage");
  const org = await requireOrg();
  const parsed = extraSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const d = parsed.data;

  const db = await createSupabaseServerClient();
  const { error } = await db.from("product_extras").insert({
    organization_id: org.organizationId,
    product_id: d.productId,
    name: d.name,
    price: d.price,
  } as never);
  if (error) return fail(error.message);
  revalidatePath("/inventario");
  return { ok: true, message: "Extra agregado." };
}
