"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrg, requirePermission } from "@/modules/auth/guards";
import { issueInvoice } from "@/modules/billing/invoice-engine";
import { calculateTaxes } from "@/modules/billing/tax-calculator";
import type { InvoiceLineInput } from "@/modules/billing/types";
import { createSaleSchema, type CreateSaleInput } from "./schema";

export interface CreateSaleResult {
  ok: boolean;
  message: string;
  orderId?: string;
  invoiceNumber?: string;
  total?: number;
}

/**
 * Crea una venta/pedido desde el POS.
 *
 * Seguridad: los PRECIOS se recalculan en servidor desde la base de datos.
 * Nunca se confía en los importes que envía el cliente. RLS asegura que solo
 * se acceden productos del tenant activo.
 */
export async function createSale(
  input: CreateSaleInput,
): Promise<CreateSaleResult> {
  const session = await requirePermission("pos.create_sale");
  const org = await requireOrg();

  const parsed = createSaleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  const db = await createSupabaseServerClient();

  // 1. Cargar precios reales de los productos del carrito.
  const productIds = [...new Set(data.lines.map((l) => l.productId))];
  const [{ data: products }, { data: variants }, { data: extras }] =
    await Promise.all([
      db.from("products").select("id, name, base_price, tax_rate").in("id", productIds),
      db.from("product_variants").select("id, product_id, name, price_delta"),
      db.from("product_extras").select("id, product_id, name, price"),
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

  // 2. Construir líneas con precios de servidor.
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
      return { ok: false, message: "Producto no encontrado en el catálogo." };
    }
    const base = Number(product.base_price ?? 0);
    const taxRate = Number(product.tax_rate ?? 0.19);

    let unit = base;
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
    const extrasSum = chosenExtras.reduce((acc, e) => acc + Number(e.price ?? 0), 0);
    unit += extrasSum;

    const lineTotal = unit * line.quantity;

    invoiceLines.push({
      description: label,
      quantity: line.quantity,
      unitPrice: unit,
      taxRate,
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

  // 3. Totales (con descuento global prorrateado al subtotal).
  const { money } = calculateTaxes(invoiceLines);
  const discount = Math.min(data.discountTotal, money.subtotal);
  const total = money.subtotal - discount + money.taxTotal;

  // 4. Crear pedido.
  const { data: order, error: orderErr } = await db
    .from("orders")
    .insert({
      organization_id: org.organizationId,
      channel: data.channel,
      status: data.channel === "pos" ? "entregado" : "recibido",
      subtotal: money.subtotal,
      tax_total: money.taxTotal,
      discount_total: discount,
      total,
      notes: data.notes ?? null,
      created_by: session.clerkUserId,
    } as never)
    .select()
    .single();

  if (orderErr || !order) {
    return { ok: false, message: orderErr?.message ?? "No se pudo crear el pedido." };
  }
  const orderId = (order as { id: string }).id;

  // 5. Items + historial + pago.
  await db.from("order_items").insert(
    orderItemsRaw.map((it) => ({
      order_id: orderId,
      organization_id: org.organizationId,
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
    organization_id: org.organizationId,
    to_status: data.channel === "pos" ? "entregado" : "recibido",
    changed_by: session.clerkUserId,
  } as never);

  await db.from("payments").insert({
    organization_id: org.organizationId,
    order_id: orderId,
    method: data.paymentMethod,
    amount: total,
    status: data.paymentMethod === "cash" ? "paid" : "pending",
  } as never);

  // 6. Movimiento de caja si es efectivo y hay sesión abierta.
  if (data.paymentMethod === "cash") {
    const { data: openSession } = await db
      .from("cash_sessions")
      .select("id")
      .eq("status", "open")
      .limit(1)
      .maybeSingle();
    if (openSession) {
      await db.from("cash_movements").insert({
        organization_id: org.organizationId,
        cash_session_id: (openSession as { id: string }).id,
        type: "sale",
        amount: total,
        ref_order_id: orderId,
      } as never);
    }
  }

  // 7. Factura (siempre en presencial; opcional en otros canales).
  let invoiceNumber: string | undefined;
  if (data.generateInvoice) {
    try {
      const { data: fiscal } = await db
        .from("organization_fiscal_settings")
        .select("legal_name, nit, regime, address, invoice_prefix, invoice_resolution")
        .eq("organization_id", org.organizationId)
        .maybeSingle();
      const f = (fiscal ?? {}) as Record<string, unknown>;

      const issued = await issueInvoice(
        db,
        {
          organizationId: org.organizationId,
          orderId,
          docType: "invoice",
          lines: invoiceLines,
          customer: { name: data.customerName ?? "Consumidor final" },
          channel: data.channel,
          actorId: session.clerkUserId,
        },
        {
          organizationId: org.organizationId,
          legalName: (f.legal_name as string) ?? "",
          nit: (f.nit as string) ?? "",
          regime: (f.regime as string) ?? "",
          address: (f.address as string) ?? "",
          prefix: (f.invoice_prefix as string) ?? "FE",
          resolution: (f.invoice_resolution as Record<string, unknown>) ?? {},
        },
      );
      invoiceNumber = issued.fullNumber;
      await db
        .from("orders")
        .update({ invoice_id: issued.id } as never)
        .eq("id", orderId);
    } catch (e) {
      // La venta ya quedó registrada; la factura puede reintentarse.
      console.error("[pos] factura falló:", e instanceof Error ? e.message : e);
    }
  }

  revalidatePath("/pos");
  revalidatePath("/pedidos");
  return {
    ok: true,
    message: invoiceNumber
      ? `Venta registrada. Factura ${invoiceNumber}.`
      : "Venta registrada.",
    orderId,
    invoiceNumber,
    total,
  };
}
