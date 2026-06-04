import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, FiscalDocType } from "@/types/database";

/**
 * Gestor de numeración fiscal.
 *
 * CRÍTICO: la numeración debe ser consecutiva, sin huecos ni duplicados, por
 * organización y por tipo de documento. Por eso reservamos el número mediante
 * una función RPC en Postgres (`next_fiscal_number`) que usa un lock de fila
 * dentro de una transacción. Nunca se calcula el consecutivo en memoria.
 *
 * Ver `supabase/migrations` -> función `next_fiscal_number`.
 */
export interface ReservedNumber {
  prefix: string;
  number: number;
  fullNumber: string;
}

export async function reserveNextNumber(
  db: SupabaseClient<Database>,
  organizationId: string,
  docType: FiscalDocType,
): Promise<ReservedNumber> {
  const { data, error } = (await db.rpc("next_fiscal_number", {
    p_organization_id: organizationId,
    p_doc_type: docType,
  } as never)) as {
    data: { prefix: string; number: number }[] | null;
    error: { message: string } | null;
  };

  if (error) {
    throw new Error(`No se pudo reservar numeración fiscal: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("La RPC next_fiscal_number no devolvió numeración.");
  }

  return {
    prefix: row.prefix as string,
    number: row.number as number,
    fullNumber: `${row.prefix}${row.number}`,
  };
}
