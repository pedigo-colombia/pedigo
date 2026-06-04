import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CourierItem {
  id: string;
  fullName: string;
  phone: string | null;
  vehicleType: string | null;
  isActive: boolean;
  relationship: string;
  lat: number | null;
  lng: number | null;
}

export interface DeliveryOrder {
  id: string;
  status: string;
  total: number;
  courierId: string | null;
  address: { lat?: number; lng?: number; line1?: string } | null;
  createdAt: string;
}

export interface CommercePoint {
  lat: number | null;
  lng: number | null;
  name: string;
}

/** Repartidores vinculados al comercio activo (propios o compartidos). */
export async function listCouriers(): Promise<CourierItem[]> {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("courier_organization_links")
    .select(
      "relationship, couriers(id, full_name, phone, vehicle_type, is_active, current_lat, current_lng)",
    );

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  return rows
    .map((r) => {
      const c = r.couriers as Record<string, unknown> | null;
      if (!c) return null;
      return {
        id: c.id as string,
        fullName: c.full_name as string,
        phone: (c.phone as string | null) ?? null,
        vehicleType: (c.vehicle_type as string | null) ?? null,
        isActive: Boolean(c.is_active),
        relationship: r.relationship as string,
        lat: (c.current_lat as number | null) ?? null,
        lng: (c.current_lng as number | null) ?? null,
      } as CourierItem;
    })
    .filter((x): x is CourierItem => x !== null);
}

/** Pedidos en estado de despacho/entrega del comercio activo. */
export async function getDeliveryOrders(): Promise<DeliveryOrder[]> {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("orders")
    .select("id, status, total, courier_id, address_snapshot, created_at")
    .in("status", ["listo", "en_camino"])
    .order("created_at", { ascending: true });

  return ((data ?? []) as Array<Record<string, unknown>>).map((o) => ({
    id: o.id as string,
    status: o.status as string,
    total: Number(o.total ?? 0),
    courierId: (o.courier_id as string | null) ?? null,
    address: (o.address_snapshot as DeliveryOrder["address"]) ?? null,
    createdAt: o.created_at as string,
  }));
}

/** Sede principal del comercio activo (para centrar el mapa). */
export async function getCommercePoint(): Promise<CommercePoint | null> {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("commerce_locations")
    .select("name, lat, lng")
    .order("is_main", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const d = data as Record<string, unknown>;
  return {
    name: d.name as string,
    lat: (d.lat as number | null) ?? null,
    lng: (d.lng as number | null) ?? null,
  };
}
