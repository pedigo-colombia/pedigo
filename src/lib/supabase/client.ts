"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";
import { useMemo } from "react";

import type { Database } from "@/types/database";

/**
 * Cliente Supabase para el NAVEGADOR (Realtime + lecturas con RLS).
 *
 * Se usa principalmente para suscripciones Realtime (KDS, pedidos, tracking).
 * El token de Clerk se inyecta vía `accessToken`, de modo que las suscripciones
 * y lecturas respetan RLS por tenant.
 */
export function useSupabaseBrowserClient(): SupabaseClient<Database> {
  const { session } = useSession();

  return useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return createClient<Database>(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      async accessToken() {
        return (await session?.getToken()) ?? null;
      },
    });
    // Recreamos el cliente si cambia la sesión.
  }, [session]);
}
