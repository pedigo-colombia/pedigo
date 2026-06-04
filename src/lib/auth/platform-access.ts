/**
 * Accesos de plataforma por correo (Google u otro proveedor en Clerk).
 * Al crear/actualizar el usuario, el webhook aplica superadmin y comercio asignado.
 */

export const PLATFORM_SUPERADMIN_EMAILS = [
  "19.joseramirez.96@gmail.com",
] as const;

/** Comercio (slug Supabase) + rol Clerk al que se une cada correo. */
export const COMMERCE_ACCESS_BY_EMAIL: Record<
  string,
  { commerceSlug: string; clerkRole: "org:admin" | "org:member" }
> = {
  "19.joseramirez.96@gmail.com": {
    commerceSlug: "el-corral-monteria",
    clerkRole: "org:admin",
  },
};

export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  return email.trim().toLowerCase();
}

export function isPlatformSuperadminEmail(email: string | null | undefined): boolean {
  const e = normalizeEmail(email);
  if (!e) return false;
  return (PLATFORM_SUPERADMIN_EMAILS as readonly string[]).includes(e);
}

export function commerceAccessForEmail(email: string | null | undefined) {
  const e = normalizeEmail(email);
  if (!e) return null;
  return COMMERCE_ACCESS_BY_EMAIL[e] ?? null;
}
