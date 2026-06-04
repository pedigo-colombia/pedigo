import "server-only";

import { auth } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Cliente Supabase para SERVIDOR con RLS activa.
 *
 * Usa la integración nativa Clerk <-> Supabase (third-party auth): pasamos el
 * token de sesión de Clerk vía `accessToken`. Las políticas RLS leen los claims
 * del token (entre ellos `organization_id`) para aislar los datos por tenant.
 *
 * IMPORTANTE: este cliente respeta RLS. Para operaciones de plataforma
 * (superadmin) usa `createSupabaseAdminClient` desde `./admin`.
 */
export async function createSupabaseServerClient(): Promise<
  SupabaseClient<Database>
> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    async accessToken() {
      const { getToken } = await auth();
      // Token de sesión de Clerk. Con la integración nativa, Supabase lo valida
      // y expone sus claims en `auth.jwt()`.
      return (await getToken()) ?? null;
    },
  });
}
