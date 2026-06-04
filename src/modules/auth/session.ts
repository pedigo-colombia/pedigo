import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

import { resolveInternalOrganizationId } from "./resolve-organization";
import { mapClerkOrgRole, type AppRole } from "./roles";

/**
 * Contexto de sesión resuelto en servidor.
 *
 * Une la información de Clerk (usuario + organización activa) con nuestros
 * roles de negocio. El `organizationId` interno (UUID de Supabase) se resuelve
 * a partir del `clerkOrgId`; lo cacheamos en la metadata de la organización
 * en Clerk para evitar un round-trip a la DB en cada request.
 */
export interface SessionContext {
  userId: string | null;
  clerkUserId: string | null;
  email: string | null;
  isSuperadmin: boolean;
  /** UUID interno (Supabase) de la organización activa, si aplica. */
  organizationId: string | null;
  clerkOrgId: string | null;
  orgRole: AppRole | null;
}

export async function getSession(): Promise<SessionContext> {
  const { userId, orgId, orgRole, sessionClaims } = await auth();
  const claims = (sessionClaims ?? {}) as Record<string, unknown>;

  const publicMeta = (claims.publicMetadata ?? {}) as Record<string, unknown>;
  const isSuperadmin = publicMeta.platform_role === "superadmin";

  const internalOrgId = await resolveInternalOrganizationId({
    claims,
    clerkOrgId: orgId ?? null,
  });

  return {
    userId: userId ?? null,
    clerkUserId: userId ?? null,
    email: (claims.email as string | undefined) ?? null,
    isSuperadmin,
    organizationId: internalOrgId,
    clerkOrgId: orgId ?? null,
    orgRole: orgId ? mapClerkOrgRole(orgRole) : isSuperadmin ? "superadmin" : null,
  };
}

/** Versión que incluye datos completos del usuario (más costosa). */
export async function getSessionWithUser() {
  const session = await getSession();
  const user = session.userId ? await currentUser() : null;
  return { session, user };
}
