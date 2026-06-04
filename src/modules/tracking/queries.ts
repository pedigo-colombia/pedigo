import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface MyOrderItem {
  id: string;
  status: string;
  total: number;
  createdAt: string;
}

export interface OrderTracking {
  id: string;
  status: string;
  total: number;
  destination: { lat?: number; lng?: number; line1?: string } | null;
  courierName: string | null;
  courierLocation: { lat: number; lng: number } | null;
}

/** Pedidos del cliente autenticado (RLS: orders_customer_select). */
export async function getMyOrders(): Promise<MyOrderItem[]> {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("orders")
    .select("id, status, total, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  return ((data ?? []) as Array<Record<string, unknown>>).map((o) => ({
    id: o.id as string,
    status: o.status as string,
    total: Number(o.total ?? 0),
    createdAt: o.created_at as string,
  }));
}

/** Datos de seguimiento de un pedido (cliente dueño). */
export async function getOrderTracking(orderId: string): Promise<OrderTracking | null> {
  const db = await createSupabaseServerClient();

  const { data: order } = await db
    .from("orders")
    .select("id, status, total, address_snapshot, courier_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return null;
  const o = order as Record<string, unknown>;
  const courierId = (o.courier_id as string | null) ?? null;

  let courierName: string | null = null;
  let courierLocation: OrderTracking["courierLocation"] = null;

  if (courierId) {
    const { data: courier } = await db
      .from("couriers")
      .select("full_name, current_lat, current_lng")
      .eq("id", courierId)
      .maybeSingle();
    if (courier) {
      const c = courier as Record<string, unknown>;
      courierName = (c.full_name as string | null) ?? null;
      if (c.current_lat != null && c.current_lng != null) {
        courierLocation = {
          lat: Number(c.current_lat),
          lng: Number(c.current_lng),
        };
      }
    }

    // Último punto de la entrega (más preciso que current_*).
    const { data: last } = await db
      .from("live_locations")
      .select("lat, lng, recorded_at")
      .eq("order_id", orderId)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (last) {
      const l = last as Record<string, unknown>;
      courierLocation = { lat: Number(l.lat), lng: Number(l.lng) };
    }
  }

  return {
    id: o.id as string,
    status: o.status as string,
    total: Number(o.total ?? 0),
    destination: (o.address_snapshot as OrderTracking["destination"]) ?? null,
    courierName,
    courierLocation,
  };
}
