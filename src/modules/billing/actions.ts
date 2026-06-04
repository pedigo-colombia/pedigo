"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrg, requirePermission } from "@/modules/auth/guards";
import { issueNote, issueSupportDocument } from "./document-engine";
import { getInvoiceDetail, type InvoiceDetail } from "./queries";

export interface BillingActionResult {
  ok: boolean;
  message: string;
}

const fiscalSchema = z.object({
  legalName: z.string().min(2, "Razón social obligatoria").max(160),
  nit: z.string().min(5, "NIT inválido").max(40),
  regime: z.string().max(120).optional().default(""),
  address: z.string().max(200).optional().default(""),
  dianEnvironment: z.enum(["mock", "test", "prod"]).default("mock"),
  invoicePrefix: z.string().min(1).max(8),
  creditNotePrefix: z.string().min(1).max(8),
  debitNotePrefix: z.string().min(1).max(8),
  supportDocPrefix: z.string().min(1).max(8),
});

export async function updateFiscalSettings(input: unknown): Promise<BillingActionResult> {
  await requirePermission("billing.manage_fiscal_settings");
  const org = await requireOrg();
  const parsed = fiscalSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const d = parsed.data;
  const db = await createSupabaseServerClient();

  const { error } = await db
    .from("organization_fiscal_settings")
    .update({
      legal_name: d.legalName,
      nit: d.nit,
      regime: d.regime,
      address: d.address,
      dian_environment: d.dianEnvironment,
      invoice_prefix: d.invoicePrefix,
      credit_note_prefix: d.creditNotePrefix,
      debit_note_prefix: d.debitNotePrefix,
      support_doc_prefix: d.supportDocPrefix,
    } as never)
    .eq("organization_id", org.organizationId);
  if (error) return { ok: false, message: error.message };

  // Mantener sincronizados los prefijos de las secuencias.
  const map: Record<string, string> = {
    invoice: d.invoicePrefix,
    credit_note: d.creditNotePrefix,
    debit_note: d.debitNotePrefix,
    support_document: d.supportDocPrefix,
  };
  for (const [docType, prefix] of Object.entries(map)) {
    await db
      .from("fiscal_sequences")
      .update({ prefix } as never)
      .eq("organization_id", org.organizationId)
      .eq("doc_type", docType);
  }

  revalidatePath("/configuracion/fiscal");
  revalidatePath("/facturacion");
  return { ok: true, message: "Configuración fiscal guardada." };
}

const noteSchema = z.object({
  invoiceId: z.string().uuid(),
  kind: z.enum(["credit_note", "debit_note"]),
  reason: z.string().min(3, "Indica el motivo").max(300),
  total: z.number().positive("Monto inválido"),
});

export async function issueInvoiceNote(input: unknown): Promise<BillingActionResult> {
  await requirePermission("billing.issue_invoice");
  const org = await requireOrg();
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const d = parsed.data;
  const db = await createSupabaseServerClient();

  try {
    const issued = await issueNote(db, {
      organizationId: org.organizationId,
      invoiceId: d.invoiceId,
      kind: d.kind,
      reason: d.reason,
      total: d.total,
      actorId: org.clerkUserId,
    });
    revalidatePath("/facturacion");
    return {
      ok: true,
      message: `${d.kind === "credit_note" ? "Nota crédito" : "Nota débito"} ${issued.fullNumber} emitida.`,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Error al emitir la nota" };
  }
}

const supportSchema = z.object({
  supplierName: z.string().min(2, "Proveedor obligatorio").max(160),
  supplierDoc: z.string().max(40).optional(),
  total: z.number().positive("Monto inválido"),
});

export async function issueSupport(input: unknown): Promise<BillingActionResult> {
  await requirePermission("billing.issue_invoice");
  const org = await requireOrg();
  const parsed = supportSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const d = parsed.data;
  const db = await createSupabaseServerClient();

  try {
    const issued = await issueSupportDocument(db, {
      organizationId: org.organizationId,
      orderId: null,
      supplier: { name: d.supplierName, document: d.supplierDoc ?? null },
      total: d.total,
    });
    revalidatePath("/facturacion");
    return { ok: true, message: `Documento soporte ${issued.fullNumber} emitido.` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Error al emitir el soporte" };
  }
}

/** Detalle de factura para el diálogo del cliente (server action de lectura). */
export async function fetchInvoiceDetail(id: string): Promise<InvoiceDetail | null> {
  await requireOrg();
  return getInvoiceDetail(id);
}
