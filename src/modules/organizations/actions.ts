"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";

import { requireSuperadmin } from "@/modules/auth/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createOrganizationSchema,
  type CreateOrganizationInput,
} from "./schema";

export interface ActionResult {
  ok: boolean;
  message: string;
}

/**
 * Onboarding de comercio (solo superadmin).
 *
 * Flujo:
 *  1. Crea la Organization en Clerk.
 *  2. Crea la fila `organizations` en Supabase (con clerk_org_id).
 *  3. Guarda el UUID interno en la metadata de la org en Clerk
 *     (para que el JWT pueda exponer `organization_id` en RLS).
 *  4. Crea settings, configuración fiscal y secuencias fiscales.
 *  5. Invita por email al commerce_admin.
 *
 * Usa el cliente admin (service_role) porque opera a nivel plataforma, tras
 * validar autorización con requireSuperadmin().
 */
export async function createOrganization(
  raw: CreateOrganizationInput,
): Promise<ActionResult> {
  await requireSuperadmin();

  const parsed = createOrganizationSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const input = parsed.data;

  const db = createSupabaseAdminClient();
  const clerk = await clerkClient();

  try {
    // 1. Clerk org
    const clerkOrg = await clerk.organizations.createOrganization({
      name: input.name,
      slug: input.slug,
    });

    // 2. Supabase organization
    const { data: org, error: orgErr } = await db
      .from("organizations")
      .insert({
        clerk_org_id: clerkOrg.id,
        name: input.name,
        slug: input.slug,
      } as never)
      .select()
      .single();

    if (orgErr || !org) {
      throw new Error(orgErr?.message ?? "No se pudo crear la organización");
    }
    const orgId = (org as { id: string }).id;

    // 3. Metadata en Clerk con el UUID interno (clave para RLS).
    await clerk.organizations.updateOrganizationMetadata(clerkOrg.id, {
      publicMetadata: { organization_id: orgId },
    });

    // 4. Settings + fiscal + secuencias
    await db.from("organization_settings").insert({ organization_id: orgId } as never);
    await db.from("organization_fiscal_settings").insert({
      organization_id: orgId,
      legal_name: input.legalName,
      nit: input.nit,
      invoice_prefix: input.invoicePrefix,
    } as never);

    await db.from("fiscal_sequences").insert([
      { organization_id: orgId, doc_type: "invoice", prefix: input.invoicePrefix, current_number: 0 },
      { organization_id: orgId, doc_type: "credit_note", prefix: "NC", current_number: 0 },
      { organization_id: orgId, doc_type: "debit_note", prefix: "ND", current_number: 0 },
      { organization_id: orgId, doc_type: "support_document", prefix: "DS", current_number: 0 },
    ] as never);

    // 5. Invitar al commerce_admin
    await clerk.organizations.createOrganizationInvitation({
      organizationId: clerkOrg.id,
      emailAddress: input.adminEmail,
      role: "org:admin",
    });

    revalidatePath("/admin/comercios");
    return {
      ok: true,
      message: `Comercio "${input.name}" creado e invitación enviada a ${input.adminEmail}.`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return { ok: false, message };
  }
}
