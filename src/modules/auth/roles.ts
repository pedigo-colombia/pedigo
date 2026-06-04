/**
 * Roles del sistema PediGo.
 *
 * Distinguimos dos planos:
 *  - `platform_role`: rol a nivel plataforma (solo `superadmin`).
 *  - `org_role`: rol dentro de una organización (tenant).
 *
 * Clerk maneja la membresía de organización; nosotros mapeamos su rol
 * de organización a nuestros roles de negocio.
 */

export const PLATFORM_ROLES = ["superadmin"] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export const ORG_ROLES = [
  "commerce_admin",
  "commerce_employee",
  "courier",
] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const APP_ROLES = [
  "superadmin",
  "commerce_admin",
  "commerce_employee",
  "courier",
  "customer",
] as const;
export type AppRole = (typeof APP_ROLES)[number];

/**
 * Mapeo entre el rol nativo de Clerk Organizations y nuestro OrgRole.
 * Clerk usa "org:admin" / "org:member" por defecto; configuramos roles
 * personalizados en el dashboard de Clerk con estas claves.
 */
export const CLERK_ORG_ROLE_MAP: Record<string, OrgRole> = {
  "org:admin": "commerce_admin",
  "org:commerce_admin": "commerce_admin",
  "org:commerce_employee": "commerce_employee",
  "org:member": "commerce_employee",
  "org:courier": "courier",
};

export function mapClerkOrgRole(clerkRole: string | null | undefined): OrgRole {
  if (!clerkRole) return "commerce_employee";
  return CLERK_ORG_ROLE_MAP[clerkRole] ?? "commerce_employee";
}

export function isOrgRole(role: string): role is OrgRole {
  return (ORG_ROLES as readonly string[]).includes(role);
}
