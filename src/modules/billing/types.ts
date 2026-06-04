import type { FiscalDocType } from "@/types/database";

/**
 * Tipos del dominio de facturación.
 *
 * El motor es agnóstico al proveedor: opera sobre estas estructuras y delega
 * la comunicación con la DIAN al `DianAdapter`.
 */

export interface MoneyBreakdown {
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
}

export interface TaxLine {
  /** Tarifa aplicada (p. ej. 0.19 para IVA 19%). */
  rate: number;
  /** Base gravable de esta línea. */
  taxableBase: number;
  /** Impuesto calculado. */
  amount: number;
}

export interface InvoiceLineInput {
  description: string;
  quantity: number;
  unitPrice: number;
  /** Tarifa de impuesto de la línea (0.19, 0.05, 0). */
  taxRate: number;
  /** Descuento monetario de la línea. */
  discount?: number;
}

export interface FiscalSettings {
  organizationId: string;
  legalName: string;
  nit: string;
  regime: string;
  address: string;
  prefix: string;
  /** Resolución DIAN: rango autorizado, fechas, etc. */
  resolution: Record<string, unknown>;
}

/** Foto fiscal inmutable del pedido al momento de facturar. */
export interface FiscalSnapshot {
  capturedAt: string;
  orderId: string | null;
  channel: string;
  lines: InvoiceLineInput[];
  money: MoneyBreakdown;
  customer: {
    name: string;
    document?: string;
    email?: string;
    address?: string;
  };
}

export interface IssueInvoiceInput {
  organizationId: string;
  orderId: string | null;
  docType: FiscalDocType;
  lines: InvoiceLineInput[];
  customer: FiscalSnapshot["customer"];
  channel: string;
  actorId: string | null;
}

export interface IssuedInvoice {
  id: string;
  fullNumber: string;
  prefix: string;
  number: number;
  money: MoneyBreakdown;
  fiscalSnapshot: FiscalSnapshot;
  cufe: string | null;
  status: string;
}
