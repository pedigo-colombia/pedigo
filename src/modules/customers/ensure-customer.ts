import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Obtiene el id de `customers` del usuario Clerk actual.
 * Si el webhook no creó el perfil, lo provisiona (mismo criterio que Clerk webhook).
 */
export async function ensureCustomerId(): Promise<
  { ok: true; customerId: string } | { ok: false; message: string }
> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, message: "Inicia sesión para continuar." };
  }

  const db = await createSupabaseServerClient();
  const { data: existing } = await db
    .from("customers")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (existing) {
    return { ok: true, customerId: (existing as { id: string }).id };
  }

  const user = await currentUser();
  const admin = createSupabaseAdminClient();
  const { data: created, error } = await admin
    .from("customers")
    .upsert(
      {
        clerk_user_id: userId,
        email: user?.emailAddresses?.[0]?.emailAddress ?? null,
        full_name:
          [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null,
      } as never,
      { onConflict: "clerk_user_id" } as never,
    )
    .select("id")
    .single();

  if (error || !created) {
    return {
      ok: false,
      message: "No se pudo vincular tu perfil de cliente. Intenta de nuevo.",
    };
  }

  return { ok: true, customerId: (created as { id: string }).id };
}
