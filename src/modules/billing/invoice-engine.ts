import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { logBillingEvent } from "./billing-events-log";
import { getDianAdapter } from "./dian/factory";
import { buildDianPayload } from "./dian/dian-payload-builder";
import { parseDianResponse } from "./dian/dian-response-parser";
import { reserveNextNumber } from "./numbering-manager";
import { calculateTaxes } from "./tax-calculator";
import type {
  FiscalSettings,
  FiscalSnapshot,
  IssueInvoiceInput,
  IssuedInvoice,
} from "./types";

/**
 * Motor de facturación PediGo (orquestador).
 *
 * Responsabilidad única: coordinar el ciclo de emisión de un documento fiscal:
 *   1. calcular impuestos (tax-calculator)
 *   2. tomar foto fiscal inmutable del pedido
 *   3. reservar numeración consecutiva (numbering-manager, RPC transaccional)
 *   4. persistir invoice + invoice_items
 *   5. construir payload DIAN y enviarlo vía adapter (mock hoy)
 *   6. registrar cada evento en la bitácora fiscal (dian_logs)
 *
 * Recibe un cliente Supabase con privilegios suficientes (service_role) porque
 * la reserva de numeración requiere transaccionalidad estricta. La autorización
 * de quién puede facturar se valida ANTES, en la server action.
 */
export async function issueInvoice(
  db: SupabaseClient<Database>,
  input: IssueInvoiceInput,
  fiscal: FiscalSettings,
): Promise<IssuedInvoice> {
  // 1. Impuestos
  const { money, taxLines } = calculateTaxes(input.lines);

  // 2. Foto fiscal inmutable
  const snapshot: FiscalSnapshot = {
    capturedAt: new Date().toISOString(),
    orderId: input.orderId,
    channel: input.channel,
    lines: input.lines,
    money,
    customer: input.customer,
  };

  await logBillingEvent(db, {
    organizationId: input.organizationId,
    docType: input.docType,
    documentId: null,
    event: "build",
    status: "ok",
    requestPayload: { snapshot, taxLines },
  });

  // 3. Numeración consecutiva (transaccional vía RPC)
  const numbering = await reserveNextNumber(
    db,
    input.organizationId,
    input.docType,
  );

  // 4. Persistir factura
  const { data: invoice, error: invError } = await db
    .from("invoices")
    .insert({
      organization_id: input.organizationId,
      order_id: input.orderId,
      type: "sale",
      prefix: numbering.prefix,
      number: numbering.number,
      full_number: numbering.fullNumber,
      status: "issued",
      customer_snapshot: snapshot.customer as never,
      fiscal_snapshot: snapshot as never,
      subtotal: money.subtotal,
      tax_total: money.taxTotal,
      total: money.total,
      issued_at: new Date().toISOString(),
    } as never)
    .select()
    .single();

  if (invError || !invoice) {
    throw new Error(`No se pudo crear la factura: ${invError?.message}`);
  }

  const invoiceId = (invoice as { id: string }).id;

  await db.from("invoice_items").insert(
    input.lines.map((l) => ({
      invoice_id: invoiceId,
      description: l.description,
      qty: l.quantity,
      unit_price: l.unitPrice,
      tax_rate: l.taxRate,
      line_total: l.unitPrice * l.quantity - (l.discount ?? 0),
    })) as never,
  );

  // 5. DIAN (adapter)
  const adapter = getDianAdapter();
  const payload = buildDianPayload({
    docType: input.docType,
    fullNumber: numbering.fullNumber,
    fiscal,
    snapshot,
  });

  await logBillingEvent(db, {
    organizationId: input.organizationId,
    docType: input.docType,
    documentId: invoiceId,
    event: "send",
    status: adapter.environment,
    requestPayload: payload,
  });

  const submission = await adapter.submit(payload);
  const parsed = parseDianResponse(submission);

  await logBillingEvent(db, {
    organizationId: input.organizationId,
    docType: input.docType,
    documentId: invoiceId,
    event: "response",
    status: parsed.status,
    responsePayload: submission.rawResponse,
  });

  // 6. Actualizar CUFE / estado
  if (parsed.cufe) {
    await db
      .from("invoices")
      .update({ cufe: parsed.cufe } as never)
      .eq("id", invoiceId);
  }

  return {
    id: invoiceId,
    fullNumber: numbering.fullNumber,
    prefix: numbering.prefix,
    number: numbering.number,
    money,
    fiscalSnapshot: snapshot,
    cufe: parsed.cufe,
    status: "issued",
  };
}
