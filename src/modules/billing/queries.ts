import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface FiscalSettings {
  legalName: string;
  nit: string;
  regime: string;
  address: string;
  dianEnvironment: string;
  invoicePrefix: string;
  creditNotePrefix: string;
  debitNotePrefix: string;
  supportDocPrefix: string;
}

export interface FiscalSequence {
  docType: string;
  prefix: string;
  currentNumber: number;
}

export interface InvoiceListItem {
  id: string;
  fullNumber: string;
  status: string;
  total: number;
  cufe: string | null;
  issuedAt: string | null;
  createdAt: string;
}

export interface InvoiceDetail extends InvoiceListItem {
  subtotal: number;
  taxTotal: number;
  customerSnapshot: Record<string, unknown>;
  fiscalSnapshot: Record<string, unknown>;
  items: { description: string; qty: number; unitPrice: number; taxRate: number; lineTotal: number }[];
  logs: { event: string; status: string; createdAt: string }[];
  notes: { kind: string; fullNumber: string; total: number; reason: string | null; status: string }[];
}

export async function getFiscalSettings(): Promise<FiscalSettings | null> {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("organization_fiscal_settings")
    .select(
      "legal_name, nit, regime, address, dian_environment, invoice_prefix, credit_note_prefix, debit_note_prefix, support_doc_prefix",
    )
    .maybeSingle();
  if (!data) return null;
  const d = data as Record<string, unknown>;
  return {
    legalName: (d.legal_name as string) ?? "",
    nit: (d.nit as string) ?? "",
    regime: (d.regime as string) ?? "",
    address: (d.address as string) ?? "",
    dianEnvironment: (d.dian_environment as string) ?? "mock",
    invoicePrefix: (d.invoice_prefix as string) ?? "FE",
    creditNotePrefix: (d.credit_note_prefix as string) ?? "NC",
    debitNotePrefix: (d.debit_note_prefix as string) ?? "ND",
    supportDocPrefix: (d.support_doc_prefix as string) ?? "DS",
  };
}

export async function getFiscalSequences(): Promise<FiscalSequence[]> {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("fiscal_sequences")
    .select("doc_type, prefix, current_number");
  return ((data ?? []) as Array<Record<string, unknown>>).map((s) => ({
    docType: s.doc_type as string,
    prefix: s.prefix as string,
    currentNumber: Number(s.current_number ?? 0),
  }));
}

export async function listInvoices(limit = 100): Promise<InvoiceListItem[]> {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("invoices")
    .select("id, full_number, status, total, cufe, issued_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as Array<Record<string, unknown>>).map(mapInvoice);
}

function mapInvoice(i: Record<string, unknown>): InvoiceListItem {
  return {
    id: i.id as string,
    fullNumber: i.full_number as string,
    status: i.status as string,
    total: Number(i.total ?? 0),
    cufe: (i.cufe as string | null) ?? null,
    issuedAt: (i.issued_at as string | null) ?? null,
    createdAt: i.created_at as string,
  };
}

export async function getInvoiceDetail(id: string): Promise<InvoiceDetail | null> {
  const db = await createSupabaseServerClient();
  const { data: invoice } = await db
    .from("invoices")
    .select(
      "id, full_number, status, total, cufe, issued_at, created_at, subtotal, tax_total, customer_snapshot, fiscal_snapshot",
    )
    .eq("id", id)
    .maybeSingle();
  if (!invoice) return null;
  const i = invoice as Record<string, unknown>;

  const [{ data: items }, { data: logs }, { data: credit }, { data: debit }] =
    await Promise.all([
      db.from("invoice_items").select("description, qty, unit_price, tax_rate, line_total").eq("invoice_id", id),
      db.from("dian_logs").select("event, status, created_at").eq("document_id", id).order("created_at"),
      db.from("credit_notes").select("prefix, number, total, reason, status").eq("invoice_id", id),
      db.from("debit_notes").select("prefix, number, total, reason, status").eq("invoice_id", id),
    ]);

  const notes: InvoiceDetail["notes"] = [
    ...((credit ?? []) as Array<Record<string, unknown>>).map((n) => ({
      kind: "Nota crédito",
      fullNumber: `${n.prefix}${n.number}`,
      total: Number(n.total ?? 0),
      reason: (n.reason as string | null) ?? null,
      status: n.status as string,
    })),
    ...((debit ?? []) as Array<Record<string, unknown>>).map((n) => ({
      kind: "Nota débito",
      fullNumber: `${n.prefix}${n.number}`,
      total: Number(n.total ?? 0),
      reason: (n.reason as string | null) ?? null,
      status: n.status as string,
    })),
  ];

  return {
    ...mapInvoice(i),
    subtotal: Number(i.subtotal ?? 0),
    taxTotal: Number(i.tax_total ?? 0),
    customerSnapshot: (i.customer_snapshot as Record<string, unknown>) ?? {},
    fiscalSnapshot: (i.fiscal_snapshot as Record<string, unknown>) ?? {},
    items: ((items ?? []) as Array<Record<string, unknown>>).map((it) => ({
      description: it.description as string,
      qty: Number(it.qty ?? 0),
      unitPrice: Number(it.unit_price ?? 0),
      taxRate: Number(it.tax_rate ?? 0),
      lineTotal: Number(it.line_total ?? 0),
    })),
    logs: ((logs ?? []) as Array<Record<string, unknown>>).map((l) => ({
      event: l.event as string,
      status: l.status as string,
      createdAt: l.created_at as string,
    })),
    notes,
  };
}
