import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Cliente Supabase con `service_role`.
 *
 * ⚠️ BYPASSEA RLS. Solo debe usarse en servidor y SIEMPRE después de validar
 * autorización propia (p. ej. `requireSuperadmin()` o validación explícita del
 * `organization_id`). Nunca importar este módulo desde código de cliente.
 *
 * Usos previstos:
 *  - Operaciones de superadmin / plataforma.
 *  - Webhooks (Clerk, Wompi) donde no hay sesión de usuario.
 *  - Procesos del motor de facturación que necesitan transaccionalidad estricta.
 *  - Seeds / scripts administrativos.
 */
let cached: SupabaseClient<Database> | null = null;

export function createSupabaseAdminClient(): SupabaseClient<Database> {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  cached = createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cached;
}
