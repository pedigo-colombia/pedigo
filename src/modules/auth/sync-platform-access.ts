import "server-only";

import { clerkClient } from "@clerk/nextjs/server";

import {
  commerceAccessForEmail,
  isPlatformSuperadminEmail,
} from "@/lib/auth/platform-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Aplica superadmin en Clerk + Supabase y membresía/invitación al comercio asignado.
 */
export async function syncPlatformAccessForClerkUser(params: {
  clerkUserId: string;
  email: string | null;
  existingPublicMetadata?: Record<string, unknown>;
}): Promise<void> {
  const { clerkUserId, email, existingPublicMetadata } = params;
  const clerk = await clerkClient();
  const db = createSupabaseAdminClient();

  const needsSuperadmin = isPlatformSuperadminEmail(email);
  const commerceAccess = commerceAccessForEmail(email);

  if (needsSuperadmin) {
    const currentRole = existingPublicMetadata?.platform_role;
    if (currentRole !== "superadmin") {
      await clerk.users.updateUserMetadata(clerkUserId, {
        publicMetadata: {
          ...existingPublicMetadata,
          platform_role: "superadmin",
        },
      });
    }

    await db.from("users").upsert(
      {
        clerk_user_id: clerkUserId,
        email,
        platform_role: "superadmin",
      } as never,
      { onConflict: "clerk_user_id" } as never,
    );
  }

  if (!commerceAccess) return;

  const { data: org } = await db
    .from("organizations")
    .select("id, name, clerk_org_id")
    .eq("slug", commerceAccess.commerceSlug)
    .maybeSingle();

  if (!org) {
    console.warn(
      `[syncPlatformAccess] Comercio no encontrado: ${commerceAccess.commerceSlug}`,
    );
    return;
  }

  const orgRow = org as { id: string; name: string; clerk_org_id: string | null };
  let clerkOrgId = orgRow.clerk_org_id;

  if (!clerkOrgId || clerkOrgId.startsWith("seed_")) {
    const clerkOrg = await clerk.organizations.createOrganization({
      name: orgRow.name,
    });
    clerkOrgId = clerkOrg.id;
    await clerk.organizations.updateOrganizationMetadata(clerkOrgId, {
      publicMetadata: { organization_id: orgRow.id },
    });
    await db
      .from("organizations")
      .update({ clerk_org_id: clerkOrgId } as never)
      .eq("id", orgRow.id);
  }

  const memberships = await clerk.organizations.getOrganizationMembershipList({
    organizationId: clerkOrgId,
    limit: 100,
  });
  const alreadyMember = memberships.data.some(
    (m) => m.publicUserData?.userId === clerkUserId,
  );

  if (!alreadyMember) {
    try {
      await clerk.organizations.createOrganizationMembership({
        organizationId: clerkOrgId,
        userId: clerkUserId,
        role: commerceAccess.clerkRole,
      });
    } catch (err) {
      console.warn("[syncPlatformAccess] membership:", err);
      if (email) {
        await clerk.organizations.createOrganizationInvitation({
          organizationId: clerkOrgId,
          emailAddress: email,
          role: commerceAccess.clerkRole,
        });
      }
    }
  }
}

/** Invitación al comercio si el usuario aún no existe en Clerk. */
export async function inviteCommerceAccessByEmail(email: string): Promise<void> {
  const commerceAccess = commerceAccessForEmail(email);
  if (!commerceAccess) return;

  const clerk = await clerkClient();
  const db = createSupabaseAdminClient();

  const { data: org } = await db
    .from("organizations")
    .select("id, name, clerk_org_id")
    .eq("slug", commerceAccess.commerceSlug)
    .maybeSingle();

  if (!org) return;

  const orgRow = org as { id: string; name: string; clerk_org_id: string | null };
  let clerkOrgId = orgRow.clerk_org_id;

  if (!clerkOrgId || clerkOrgId.startsWith("seed_")) {
    const clerkOrg = await clerk.organizations.createOrganization({
      name: orgRow.name,
    });
    clerkOrgId = clerkOrg.id;
    await clerk.organizations.updateOrganizationMetadata(clerkOrgId, {
      publicMetadata: { organization_id: orgRow.id },
    });
    await db
      .from("organizations")
      .update({ clerk_org_id: clerkOrgId } as never)
      .eq("id", orgRow.id);
  }

  await clerk.organizations.createOrganizationInvitation({
    organizationId: clerkOrgId,
    emailAddress: email,
    role: commerceAccess.clerkRole,
  });
}
