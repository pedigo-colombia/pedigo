"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureCustomerId } from "@/modules/customers/ensure-customer";
import { calculateTaxes } from "@/modules/billing/tax-calculator";
import type { InvoiceLineInput } from "@/modules/billing/types";
import { cartLineSchema } from "@/modules/pos/schema";
import { getCommerceBySlug } from "./catalog-public";

export interface CustomerOrderResult {
  ok: boolean;
  message: string;
  orderId?: string;
}

const customerOrderSchema = z.object({
  commerceSlug: z.string().min(1),
  lines: z.array(cartLineSchema).min(1, "Agrega al menos un producto"),
  fulfillment: z.enum(["pickup", "delivery"]),
  addressId: z.string().uuid().optional(),
  paymentMethod: z.enum(["cash", "transfer", "online"]).default("cash"),
  notes: z.string().max(500).optional(),
});

/**
 * Crea un pedido desde la app cliente (canal `app`).
 * Precios y productos se validan en servidor; el cliente queda vinculado por RLS.
 */
export async function createCustomerOrder(
  input: unknown,
): Promise<CustomerOrderResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, message: "Debes iniciar sesión." };

  const parsed = customerOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  const commerce = await getCommerceBySlug(data.commerceSlug);
  if (!commerce) return { ok: false, message: "Comercio no encontrado." };

  const ensured = await ensureCustomerId();
  if (!ensured.ok) return { ok: false, message: ensured.message };
  const customerId = ensured.customerId;

  const db = createSupabaseAdminClient();
  const orgId = commerce.id;

  let addressSnapshot: Record<string, unknown> | null = null;
  if (data.fulfillment === "delivery") {
    if (!data.addressId) {
      return { ok: false, message: "Selecciona una dirección de entrega." };
    }
    const { data: addr } = await db
      .from("customer_addresses")
      .select("line1, city, lat, lng, label")
      .eq("id", data.addressId)
      .eq("customer_id", customerId)
      .maybeSingle();
    if (!addr) return { ok: false, message: "Dirección no válida." };
    const a = addr as Record<string, unknown>;
    addressSnapshot = {
      label: a.label,
      line1: a.line1,
      city: a.city,
      lat: a.lat,
      lng: a.lng,
    };
  }

  const productIds = [...new Set(data.lines.map((l) => l.productId))];
  const [{ data: products }, { data: variants }, { data: extras }] = await Promise.all([
    db
      .from("products")
      .select("id, name, base_price, tax_rate")
      .eq("organization_id", orgId)
      .in("id", productIds),
    db.from("product_variants").select("id, product_id, name, price_delta").eq("organization_id", orgId),
    db.from("product_extras").select("id, product_id, name, price").eq("organization_id", orgId),
  ]);

  const productMap = new Map(
    ((products ?? []) as Array<Record<string, unknown>>).map((p) => [p.id as string, p]),
  );
  const variantMap = new Map(
    ((variants ?? []) as Array<Record<string, unknown>>).map((v) => [v.id as string, v]),
  );
  const extraMap = new Map(
    ((extras ?? []) as Array<Record<string, unknown>>).map((e) => [e.id as string, e]),
  );

  const invoiceLines: InvoiceLineInput[] = [];
  const orderItemsRaw: Array<{
    product_id: string;
    variant_id: string | null;
    qty: number;
    unit_price: number;
    extras: { id: string; name: string; price: number }[];
    line_total: number;
  }> = [];

  for (const line of data.lines) {
    const product = productMap.get(line.productId);
    if (!product) {
      return { ok: false, message: "Un producto ya no está disponible." };
    }
    let unit = Number(product.base_price ?? 0);
    let label = product.name as string;
    if (line.variantId) {
      const v = variantMap.get(line.variantId);
      if (v) {
        unit += Number(v.price_delta ?? 0);
        label += ` (${v.name as string})`;
      }
    }
    const chosenExtras = line.extraIds
      .map((id) => extraMap.get(id))
      .filter(Boolean) as Array<Record<string, unknown>>;
    unit += chosenExtras.reduce((acc, e) => acc + Number(e.price ?? 0), 0);
    const lineTotal = unit * line.quantity;

    invoiceLines.push({
      description: label,
      quantity: line.quantity,
      unitPrice: unit,
      taxRate: Number(product.tax_rate ?? 0.19),
    });
    orderItemsRaw.push({
      product_id: line.productId,
      variant_id: line.variantId,
      qty: line.quantity,
      unit_price: unit,
      extras: chosenExtras.map((e) => ({
        id: e.id as string,
        name: e.name as string,
        price: Number(e.price ?? 0),
      })),
      line_total: lineTotal,
    });
  }

  const { money } = calculateTaxes(invoiceLines);
  const total = money.subtotal + money.taxTotal;

  const { data: order, error: orderErr } = await db
    .from("orders")
    .insert({
      organization_id: orgId,
      customer_id: customerId,
      channel: "app",
      status: "recibido",
      subtotal: money.subtotal,
      tax_total: money.taxTotal,
      discount_total: 0,
      total,
      notes: data.notes ?? null,
      address_snapshot: addressSnapshot,
      created_by: userId,
    } as never)
    .select("id")
    .single();

  if (orderErr || !order) {
    return { ok: false, message: orderErr?.message ?? "No se pudo crear el pedido." };
  }
  const orderId = (order as { id: string }).id;

  await db.from("order_items").insert(
    orderItemsRaw.map((it) => ({
      order_id: orderId,
      organization_id: orgId,
      product_id: it.product_id,
      variant_id: it.variant_id,
      qty: it.qty,
      unit_price: it.unit_price,
      extras: it.extras,
      line_total: it.line_total,
    })) as never,
  );

  await db.from("order_status_history").insert({
    order_id: orderId,
    organization_id: orgId,
    to_status: "recibido",
    changed_by: userId,
  } as never);

  await db.from("payments").insert({
    organization_id: orgId,
    order_id: orderId,
    method: data.paymentMethod,
    amount: total,
    status: "pending",
  } as never);

  for (const line of data.lines) {
    const { data: inv } = await db
      .from("inventory_items")
      .select("id, stock_qty")
      .eq("organization_id", orgId)
      .eq("product_id", line.productId)
      .maybeSingle();
    if (!inv) continue;
    const invRow = inv as { id: string; stock_qty: number };
    const next = Math.max(0, Number(invRow.stock_qty) - line.quantity);
    await db.from("inventory_items").update({ stock_qty: next } as never).eq("id", invRow.id);
    await db.from("inventory_movements").insert({
      organization_id: orgId,
      inventory_item_id: invRow.id,
      type: "out",
      qty: line.quantity,
      reason: `Pedido app #${orderId.slice(0, 6)}`,
    } as never);
  }

  revalidatePath("/mis-pedidos");
  revalidatePath(`/pedir/${data.commerceSlug}`);
  return {
    ok: true,
    message: `Pedido confirmado en ${commerce.name}.`,
    orderId,
  };
}
