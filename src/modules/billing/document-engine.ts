import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { logBillingEvent } from "./billing-events-log";
import { getDianAdapter } from "./dian/factory";
import { reserveNextNumber } from "./numbering-manager";

export interface IssueNoteInput {
  organizationId: string;
  invoiceId: string;
  kind: "credit_note" | "debit_note";
  reason: string;
  total: number;
  actorId: string | null;
}

export interface IssuedDocument {
  id: string;
  fullNumber: string;
  cufe: string | null;
}

/**
 * Emite una nota crédito o débito asociada a una factura.
 * Reutiliza el mismo flujo del motor: numeración consecutiva + adapter DIAN +
 * bitácora fiscal. Sin acoplarse a la implementación real de la DIAN.
 */
export async function issueNote(
  db: SupabaseClient<Database>,
  input: IssueNoteInput,
): Promise<IssuedDocument> {
  const numbering = await reserveNextNumber(db, input.organizationId, input.kind);
  const table = input.kind === "credit_note" ? "credit_notes" : "debit_notes";

  const { data: row, error } = await db
    .from(table)
    .insert({
      organization_id: input.organizationId,
      invoice_id: input.invoiceId,
      prefix: numbering.prefix,
      number: numbering.number,
      reason: input.reason,
      total: input.total,
      status: "issued",
    } as never)
    .select("id")
    .single();

  if (error || !row) {
    throw new Error(error?.message ?? "No se pudo crear la nota");
  }
  const docId = (row as { id: string }).id;

  await logBillingEvent(db, {
    organizationId: input.organizationId,
    docType: input.kind,
    documentId: docId,
    event: "build",
    status: "ok",
    requestPayload: { invoiceId: input.invoiceId, reason: input.reason, total: input.total },
  });

  const adapter = getDianAdapter();
  const submission = await adapter.submit({
    organizationId: input.organizationId,
    docType: input.kind,
    fullNumber: numbering.fullNumber,
    document: { invoiceId: input.invoiceId, reason: input.reason, total: input.total },
  });

  await logBillingEvent(db, {
    organizationId: input.organizationId,
    docType: input.kind,
    documentId: docId,
    event: "response",
    status: submission.status,
    responsePayload: submission.rawResponse,
  });

  if (submission.cufe) {
    await db.from(table).update({ cufe: submission.cufe } as never).eq("id", docId);
  }

  return { id: docId, fullNumber: numbering.fullNumber, cufe: submission.cufe };
}

export interface IssueSupportInput {
  organizationId: string;
  orderId: string | null;
  supplier: Record<string, unknown>;
  total: number;
}

/** Emite un documento soporte (compras a no obligados a facturar). */
export async function issueSupportDocument(
  db: SupabaseClient<Database>,
  input: IssueSupportInput,
): Promise<IssuedDocument> {
  const numbering = await reserveNextNumber(db, input.organizationId, "support_document");

  const { data: row, error } = await db
    .from("support_documents")
    .insert({
      organization_id: input.organizationId,
      order_id: input.orderId,
      prefix: numbering.prefix,
      number: numbering.number,
      supplier_info: input.supplier,
      total: input.total,
      status: "issued",
    } as never)
    .select("id")
    .single();

  if (error || !row) {
    throw new Error(error?.message ?? "No se pudo crear el documento soporte");
  }
  const docId = (row as { id: string }).id;

  await logBillingEvent(db, {
    organizationId: input.organizationId,
    docType: "support_document",
    documentId: docId,
    event: "build",
    status: "ok",
    requestPayload: input.supplier,
  });

  return { id: docId, fullNumber: numbering.fullNumber, cufe: null };
}
