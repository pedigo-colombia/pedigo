/* eslint-disable no-console */
/**
 * Otorga superadmin y acceso al comercio configurado en platform-access.ts.
 *
 * Uso: npm run user:grant-access
 * Requiere CLERK_SECRET_KEY y Supabase en .env.local
 */
import { config } from "dotenv";
import { createClerkClient } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";

import {
  PLATFORM_SUPERADMIN_EMAILS,
  commerceAccessForEmail,
  normalizeEmail,
} from "../src/lib/auth/platform-access";

config({ path: ".env.local" });

const clerkSecret = process.env.CLERK_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!clerkSecret || !supabaseUrl || !supabaseKey) {
  console.error("Faltan CLERK_SECRET_KEY o variables de Supabase en .env.local");
  process.exit(1);
}

const clerk = createClerkClient({ secretKey: clerkSecret });
const db = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

async function ensureClerkOrg(org: {
  id: string;
  name: string;
  clerk_org_id: string | null;
}): Promise<string> {
  if (org.clerk_org_id && !org.clerk_org_id.startsWith("seed_")) {
    return org.clerk_org_id;
  }
  const clerkOrg = await clerk.organizations.createOrganization({ name: org.name });
  await clerk.organizations.updateOrganizationMetadata(clerkOrg.id, {
    publicMetadata: { organization_id: org.id },
  });
  await db
    .from("organizations")
    .update({ clerk_org_id: clerkOrg.id })
    .eq("id", org.id);
  console.log(`  ✓ Org Clerk creada/vinculada: ${clerkOrg.id} (${org.name})`);
  return clerkOrg.id;
}

async function grantEmail(email: string) {
  const normalized = normalizeEmail(email)!;
  console.log(`\n→ ${normalized}`);

  const list = await clerk.users.getUserList({
    emailAddress: [normalized],
    limit: 5,
  });
  const user = list.data[0];

  if (!user) {
    console.log("  Usuario aún no existe en Clerk. Se envía invitación al comercio.");
    console.log("  Tras iniciar sesión con Google, el webhook aplicará superadmin.");
    const access = commerceAccessForEmail(normalized);
    if (access) {
      const { data: org } = await db
        .from("organizations")
        .select("id, name, clerk_org_id")
        .eq("slug", access.commerceSlug)
        .maybeSingle();
      if (org) {
        const clerkOrgId = await ensureClerkOrg(org as { id: string; name: string; clerk_org_id: string | null });
        await clerk.organizations.createOrganizationInvitation({
          organizationId: clerkOrgId,
          emailAddress: normalized,
          role: access.clerkRole,
        });
        console.log(`  ✓ Invitación enviada a ${access.commerceSlug}`);
      }
    }
    return;
  }

  const meta = (user.publicMetadata ?? {}) as Record<string, unknown>;
  if (meta.platform_role !== "superadmin") {
    await clerk.users.updateUserMetadata(user.id, {
      publicMetadata: { ...meta, platform_role: "superadmin" },
    });
    console.log("  ✓ Superadmin en Clerk (public_metadata)");
  } else {
    console.log("  ✓ Ya era superadmin en Clerk");
  }

  await db.from("users").upsert(
    {
      clerk_user_id: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? normalized,
      platform_role: "superadmin",
      full_name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
    },
    { onConflict: "clerk_user_id" },
  );
  console.log("  ✓ Fila users en Supabase");

  const access = commerceAccessForEmail(normalized);
  if (!access) return;

  const { data: org } = await db
    .from("organizations")
    .select("id, name, clerk_org_id")
    .eq("slug", access.commerceSlug)
    .maybeSingle();

  if (!org) {
    console.warn(`  ⚠ Comercio ${access.commerceSlug} no encontrado (¿corriste db:seed?)`);
    return;
  }

  const clerkOrgId = await ensureClerkOrg(org as { id: string; name: string; clerk_org_id: string | null });

  const memberships = await clerk.organizations.getOrganizationMembershipList({
    organizationId: clerkOrgId,
    limit: 100,
  });
  const isMember = memberships.data.some((m) => m.publicUserData?.userId === user.id);

  if (isMember) {
    console.log(`  ✓ Ya es miembro de ${access.commerceSlug}`);
  } else {
    await clerk.organizations.createOrganizationMembership({
      organizationId: clerkOrgId,
      userId: user.id,
      role: access.clerkRole,
    });
    console.log(`  ✓ Agregado a ${access.commerceSlug} como ${access.clerkRole}`);
  }
}

async function main() {
  console.log("Otorgando acceso de plataforma…");
  for (const email of PLATFORM_SUPERADMIN_EMAILS) {
    await grantEmail(email);
  }
  console.log("\nListo. Si acabas de crear la cuenta, cierra sesión y vuelve a entrar.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
