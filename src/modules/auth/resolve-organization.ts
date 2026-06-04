import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** UUID interno de Supabase a partir del JWT de Clerk y/o org activa. */
export async function resolveInternalOrganizationId(params: {
  claims: Record<string, unknown>;
  clerkOrgId: string | null;
}): Promise<string | null> {
  const orgPublicMeta = (params.claims.org_public_metadata ?? {}) as Record<
    string,
    unknown
  >;

  const fromOrgMeta = orgPublicMeta.organization_id as string | undefined;
  if (fromOrgMeta) return fromOrgMeta;

  const fromClaim = params.claims.organization_id as string | undefined;
  if (fromClaim) return fromClaim;

  if (!params.clerkOrgId) return null;

  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("organizations")
    .select("id")
    .eq("clerk_org_id", params.clerkOrgId)
    .maybeSingle();

  return (data as { id: string } | null)?.id ?? null;
}
