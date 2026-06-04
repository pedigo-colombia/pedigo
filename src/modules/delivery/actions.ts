"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireOrg, requirePermission } from "@/modules/auth/guards";
import { pickNearestCourier, type CandidateCourier } from "./proximity";

export interface DeliveryActionResult {
  ok: boolean;
  message: string;
}

const courierSchema = z.object({
  fullName: z.string().min(2, "Nombre obligatorio").max(120),
  email: z.string().email("Email válido obligatorio para invitar"),
  phone: z.string().max(40).optional(),
  vehicleType: z.string().max(40).optional(),
  relationship: z.enum(["owned", "shared"]).default("owned"),
});

const assignSchema = z.object({
  orderId: z.string().uuid(),
  courierId: z.string().uuid(),
  method: z.enum(["manual", "auto_proximity"]).default("manual"),
});

/** Alta de repartidor + vínculo con el comercio + invitación Clerk (org:courier). */
export async function createCourier(input: unknown): Promise<DeliveryActionResult> {
  await requirePermission("delivery.assign");
  const org = await requireOrg();
  if (!org.clerkOrgId) {
    return { ok: false, message: "No hay organización activa en Clerk." };
  }

  const parsed = courierSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const d = parsed.data;

  const admin = createSupabaseAdminClient();
  const clerk = await clerkClient();

  try {
    const { data: courier, error } = await admin
      .from("couriers")
      .insert({
        full_name: d.fullName,
        phone: d.phone ?? null,
        vehicle_type: d.vehicleType ?? "moto",
        invite_email: d.email,
        is_active: true,
      } as never)
      .select("id")
      .single();
    if (error || !courier) {
      return { ok: false, message: error?.message ?? "No se pudo crear el repartidor" };
    }

    await admin.from("courier_organization_links").insert({
      courier_id: (courier as { id: string }).id,
      organization_id: org.organizationId,
      relationship: d.relationship,
    } as never);

    await clerk.organizations.createOrganizationInvitation({
      organizationId: org.clerkOrgId,
      emailAddress: d.email,
      role: "org:courier",
    });

    revalidatePath("/repartidores");
    return {
      ok: true,
      message: `Repartidor creado. Invitación enviada a ${d.email}.`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return { ok: false, message };
  }
}

export async function setCourierActive(
  courierId: string,
  isActive: boolean,
): Promise<DeliveryActionResult> {
  await requirePermission("delivery.assign");
  const org = await requireOrg();

  const admin = createSupabaseAdminClient();
  // Verifica que el repartidor esté vinculado a esta organización.
  const { data: link } = await admin
    .from("courier_organization_links")
    .select("id")
    .eq("courier_id", courierId)
    .eq("organization_id", org.organizationId)
    .maybeSingle();
  if (!link) return { ok: false, message: "Repartidor no pertenece a tu comercio." };

  const { error } = await admin
    .from("couriers")
    .update({ is_active: isActive } as never)
    .eq("id", courierId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/repartidores");
  return { ok: true, message: isActive ? "Repartidor activo." : "Repartidor inactivo." };
}

async function doAssign(
  orderId: string,
  courierId: string,
  method: "manual" | "auto_proximity",
  organizationId: string,
  actorId: string | null,
): Promise<DeliveryActionResult> {
  const db = await createSupabaseServerClient();

  const { error: assignErr } = await db.from("courier_assignments").insert({
    organization_id: organizationId,
    order_id: orderId,
    courier_id: courierId,
    method,
    status: "active",
  } as never);
  if (assignErr) return { ok: false, message: assignErr.message };

  await db
    .from("orders")
    .update({ courier_id: courierId, status: "en_camino" } as never)
    .eq("id", orderId);

  await db.from("order_status_history").insert({
    order_id: orderId,
    organization_id: organizationId,
    to_status: "en_camino",
    changed_by: actorId,
  } as never);

  revalidatePath("/repartidores");
  revalidatePath("/mapa");
  revalidatePath("/pedidos");
  return {
    ok: true,
    message:
      method === "auto_proximity"
        ? "Asignado por cercanía."
        : "Repartidor asignado.",
  };
}

export async function assignCourier(input: unknown): Promise<DeliveryActionResult> {
  await requirePermission("delivery.assign");
  const org = await requireOrg();
  const parsed = assignSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Datos inválidos" };
  return doAssign(
    parsed.data.orderId,
    parsed.data.courierId,
    parsed.data.method,
    org.organizationId,
    org.clerkUserId,
  );
}

/** Asigna automáticamente el repartidor activo más cercano a la dirección. */
export async function autoAssignNearest(orderId: string): Promise<DeliveryActionResult> {
  await requirePermission("delivery.assign");
  const org = await requireOrg();
  const db = await createSupabaseServerClient();

  const { data: order } = await db
    .from("orders")
    .select("address_snapshot")
    .eq("id", orderId)
    .maybeSingle();
  const addr = (order as { address_snapshot?: { lat?: number; lng?: number } } | null)
    ?.address_snapshot;

  // Si no hay dirección, usamos la sede como origen de referencia.
  let origin = addr?.lat != null && addr?.lng != null ? { lat: addr.lat, lng: addr.lng } : null;
  if (!origin) {
    const { data: loc } = await db
      .from("commerce_locations")
      .select("lat, lng")
      .order("is_main", { ascending: false })
      .limit(1)
      .maybeSingle();
    const l = loc as { lat?: number; lng?: number } | null;
    if (l?.lat != null && l?.lng != null) origin = { lat: l.lat, lng: l.lng };
  }
  if (!origin) return { ok: false, message: "Sin coordenadas para calcular cercanía." };

  const { data: links } = await db
    .from("courier_organization_links")
    .select("couriers(id, is_active, current_lat, current_lng)");

  const candidates: CandidateCourier[] = ((links ?? []) as Array<Record<string, unknown>>)
    .map((r) => {
      const c = r.couriers as Record<string, unknown> | null;
      if (!c) return null;
      return {
        id: c.id as string,
        isActive: Boolean(c.is_active),
        lat: (c.current_lat as number | null) ?? null,
        lng: (c.current_lng as number | null) ?? null,
      } as CandidateCourier;
    })
    .filter((x): x is CandidateCourier => x !== null);

  const nearest = pickNearestCourier(origin, candidates);
  if (!nearest) {
    return { ok: false, message: "No hay repartidores activos con ubicación." };
  }

  return doAssign(orderId, nearest.id, "auto_proximity", org.organizationId, org.clerkUserId);
}
