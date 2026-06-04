import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, FiscalDocType } from "@/types/database";

/**
 * Bitácora de eventos fiscales/técnicos (`dian_logs`).
 *
 * Toda etapa del ciclo de vida de un documento (build, validate, sign, send,
 * response) queda registrada para trazabilidad fiscal y técnica. Es la base
 * para auditoría, reintentos y contingencia en la fase DIAN real.
 */
export type BillingEvent =
  | "build"
  | "validate"
  | "sign"
  | "send"
  | "response"
  | "void";

export async function logBillingEvent(
  db: SupabaseClient<Database>,
  args: {
    organizationId: string;
    docType: FiscalDocType;
    documentId: string | null;
    event: BillingEvent;
    status: string;
    requestPayload?: unknown;
    responsePayload?: unknown;
  },
): Promise<void> {
  const { error } = await db.from("dian_logs").insert({
    organization_id: args.organizationId,
    document_type: args.docType,
    document_id: args.documentId,
    event: args.event,
    status: args.status,
    request_payload: (args.requestPayload ?? null) as never,
    response_payload: (args.responsePayload ?? null) as never,
  } as never);

  if (error) {
    // El logging no debe romper la facturación, pero sí dejar rastro.
    console.error("[billing] No se pudo registrar evento fiscal:", error.message);
  }
}
