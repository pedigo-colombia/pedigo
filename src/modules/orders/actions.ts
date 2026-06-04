"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrg, requirePermission } from "@/modules/auth/guards";

const ORDER_STATUSES = [
  "recibido",
  "en_preparacion",
  "listo",
  "en_camino",
  "entregado",
  "cancelado",
  "rechazado",
  "incidencia",
  "reprogramado",
  "devuelto",
] as const;

const updateStatusSchema = z.object({
  orderId: z.string().uuid(),
  toStatus: z.enum(ORDER_STATUSES),
});

export interface OrderActionResult {
  ok: boolean;
  message: string;
}

/** Cambia el estado de un pedido y registra el timeline. */
export async function updateOrderStatus(
  input: z.infer<typeof updateStatusSchema>,
): Promise<OrderActionResult> {
  const session = await requirePermission("orders.update_status");
  const org = await requireOrg();

  const parsed = updateStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Datos inválidos" };
  const { orderId, toStatus } = parsed.data;

  const db = await createSupabaseServerClient();

  const { data: current } = await db
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();
  const fromStatus = (current as { status?: string } | null)?.status ?? null;

  const { error } = await db
    .from("orders")
    .update({ status: toStatus } as never)
    .eq("id", orderId);
  if (error) return { ok: false, message: error.message };

  await db.from("order_status_history").insert({
    order_id: orderId,
    organization_id: org.organizationId,
    from_status: fromStatus,
    to_status: toStatus,
    changed_by: session.clerkUserId,
  } as never);

  revalidatePath("/pedidos");
  revalidatePath("/cocina");
  return { ok: true, message: "Estado actualizado." };
}
