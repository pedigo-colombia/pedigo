import "server-only";

import { can, type Permission } from "./permissions";
import { getSession, type SessionContext } from "./session";

/**
 * Errores de autorización tipados para distinguir 401 vs 403 vs 400.
 */
export class UnauthenticatedError extends Error {
  constructor(message = "No autenticado") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "No autorizado") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class MissingTenantError extends Error {
  constructor(message = "No hay organización activa") {
    super(message);
    this.name = "MissingTenantError";
  }
}

/** Exige sesión autenticada. */
export async function requireAuth(): Promise<SessionContext> {
  const session = await getSession();
  if (!session.userId) throw new UnauthenticatedError();
  return session;
}

/** Exige sesión + organización (tenant) activa. */
export async function requireOrg(): Promise<
  SessionContext & { organizationId: string }
> {
  const session = await requireAuth();
  if (!session.organizationId) throw new MissingTenantError();
  return session as SessionContext & { organizationId: string };
}

/** Exige superadmin de plataforma. */
export async function requireSuperadmin(): Promise<SessionContext> {
  const session = await requireAuth();
  if (!session.isSuperadmin) throw new ForbiddenError();
  return session;
}

/** Exige que el rol activo tenga el permiso indicado. */
export async function requirePermission(
  permission: Permission,
): Promise<SessionContext> {
  const session = await requireAuth();
  if (!can(session.orgRole, permission)) throw new ForbiddenError();
  return session;
}
