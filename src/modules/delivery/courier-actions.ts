"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/modules/auth/session";

export interface CourierActionResult {
  ok: boolean;
  message: string;
}

async function resolveCourierId(): Promise<string | null> {
  const session = await getSession();
  if (!session.clerkUserId) return null;
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("couriers")
    .select("id")
    .eq("clerk_user_id", session.clerkUserId)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

/** El repartidor cambia su disponibilidad (conectarse/desconectarse). */
export async function courierSetAvailability(
  isActive: boolean,
): Promise<CourierActionResult> {
  const courierId = await resolveCourierId();
  if (!courierId) return { ok: false, message: "No estás registrado como repartidor." };

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("couriers")
    .update({ is_active: isActive } as never)
    .eq("id", courierId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/courier");
  return { ok: true, message: isActive ? "Conectado." : "Desconectado." };
}

/** El repartidor marca la entrega como completada. */
export async function courierMarkDelivered(
  orderId: string,
): Promise<CourierActionResult> {
  const courierId = await resolveCourierId();
  if (!courierId) return { ok: false, message: "No estás registrado como repartidor." };

  const admin = createSupabaseAdminClient();

  // Verifica que el pedido esté asignado a este repartidor.
  const { data: order } = await admin
    .from("orders")
    .select("id, organization_id, courier_id, status")
    .eq("id", orderId)
    .maybeSingle();
  const o = order as Record<string, unknown> | null;
  if (!o || o.courier_id !== courierId) {
    return { ok: false, message: "Este pedido no está asignado a ti." };
  }

  await admin
    .from("orders")
    .update({ status: "entregado" } as never)
    .eq("id", orderId);

  await admin.from("order_status_history").insert({
    order_id: orderId,
    organization_id: o.organization_id as string,
    from_status: o.status as string,
    to_status: "entregado",
    changed_by: courierId,
  } as never);

  await admin
    .from("courier_assignments")
    .update({ status: "completed" } as never)
    .eq("order_id", orderId)
    .eq("courier_id", courierId);

  revalidatePath("/courier");
  return { ok: true, message: "Entrega completada." };
}
