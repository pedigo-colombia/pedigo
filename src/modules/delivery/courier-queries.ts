import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/modules/auth/session";

export interface MyCourierContext {
  courier: { id: string; fullName: string; isActive: boolean } | null;
  activeOrder: {
    id: string;
    status: string;
    total: number;
    address: { lat?: number; lng?: number; line1?: string } | null;
    organizationId: string;
  } | null;
}

/**
 * Contexto del repartidor autenticado: su ficha y la entrega activa.
 * Usa service_role porque el repartidor no es miembro de la organización en
 * Clerk; la identidad se valida por `clerk_user_id`.
 */
export async function getMyCourierContext(): Promise<MyCourierContext> {
  const session = await getSession();
  if (!session.clerkUserId) return { courier: null, activeOrder: null };

  const admin = createSupabaseAdminClient();
  const { data: courier } = await admin
    .from("couriers")
    .select("id, full_name, is_active")
    .eq("clerk_user_id", session.clerkUserId)
    .maybeSingle();

  if (!courier) return { courier: null, activeOrder: null };
  const c = courier as Record<string, unknown>;

  const { data: assignment } = await admin
    .from("courier_assignments")
    .select("order_id, organization_id, orders(id, status, total, address_snapshot)")
    .eq("courier_id", c.id as string)
    .eq("status", "active")
    .order("assigned_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let activeOrder: MyCourierContext["activeOrder"] = null;
  if (assignment) {
    const a = assignment as Record<string, unknown>;
    const o = a.orders as Record<string, unknown> | null;
    if (o) {
      activeOrder = {
        id: o.id as string,
        status: o.status as string,
        total: Number(o.total ?? 0),
        address:
          (o.address_snapshot as { lat?: number; lng?: number; line1?: string } | null) ??
          null,
        organizationId: a.organization_id as string,
      };
    }
  }

  return {
    courier: {
      id: c.id as string,
      fullName: c.full_name as string,
      isActive: Boolean(c.is_active),
    },
    activeOrder,
  };
}
