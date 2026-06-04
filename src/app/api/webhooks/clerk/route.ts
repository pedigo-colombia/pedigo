import { type NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";

import { isPlatformSuperadminEmail } from "@/lib/auth/platform-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncPlatformAccessForClerkUser } from "@/modules/auth/sync-platform-access";

/**
 * Webhook de Clerk -> Supabase.
 *
 * Sincroniza usuarios y organizaciones. Verifica la firma (Svix) usando
 * CLERK_WEBHOOK_SECRET. Ruta pública (declarada en middleware) pero protegida
 * por la verificación de firma.
 */
export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("[webhook:clerk] firma inválida", err);
    return new NextResponse("Firma inválida", { status: 400 });
  }

  const db = createSupabaseAdminClient();
  const type = evt.type;

  try {
    if (type === "user.created" || type === "user.updated") {
      const u = evt.data;
      const email = u.email_addresses?.[0]?.email_address ?? null;
      const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ");
      const publicMeta = (u.public_metadata ?? {}) as Record<string, unknown>;
      const autoSuperadmin = isPlatformSuperadminEmail(email);
      const isSuperadmin =
        publicMeta.platform_role === "superadmin" || autoSuperadmin;

      if (autoSuperadmin) {
        await syncPlatformAccessForClerkUser({
          clerkUserId: u.id,
          email,
          existingPublicMetadata: publicMeta,
        });
      }

      // Espejo de back-office.
      await db.from("users").upsert(
        {
          clerk_user_id: u.id,
          email,
          full_name: fullName || null,
          platform_role: isSuperadmin ? "superadmin" : null,
          avatar_url: u.image_url ?? null,
        } as never,
        { onConflict: "clerk_user_id" } as never,
      );

      // Perfil de cliente final (registro obligatorio de clientes).
      await db.from("customers").upsert(
        {
          clerk_user_id: u.id,
          email,
          full_name: fullName || null,
        } as never,
        { onConflict: "clerk_user_id" } as never,
      );

      // Vincula repartidor pendiente invitado por email.
      if (email) {
        await db
          .from("couriers")
          .update({ clerk_user_id: u.id, invite_email: null } as never)
          .eq("invite_email", email)
          .is("clerk_user_id", null);
      }
    }

    if (type === "organization.created" || type === "organization.updated") {
      const o = evt.data;
      await db.from("organizations").upsert(
        {
          clerk_org_id: o.id,
          name: o.name,
          slug: o.slug ?? o.id,
        } as never,
        { onConflict: "clerk_org_id" } as never,
      );
    }
  } catch (err) {
    console.error("[webhook:clerk] error procesando", type, err);
    return new NextResponse("Error interno", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
