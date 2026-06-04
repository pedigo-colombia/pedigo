import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { OrderChannel, OrderStatus } from "@/types/database";

export interface OrderListItem {
  id: string;
  channel: OrderChannel;
  status: OrderStatus;
  total: number;
  itemCount: number;
  createdAt: string;
  customerName: string | null;
  addressLine: string | null;
}

function mapOrder(o: Record<string, unknown>): OrderListItem {
  const items = o.order_items as Array<{ count: number }> | undefined;
  const snap = o.address_snapshot as Record<string, unknown> | null;
  const customer = o.customers as { full_name: string | null } | null;
  const addressParts = snap
    ? [snap.line1, snap.municipality ?? snap.city, snap.department].filter(Boolean)
    : [];

  return {
    id: o.id as string,
    channel: o.channel as OrderChannel,
    status: o.status as OrderStatus,
    total: Number(o.total ?? 0),
    itemCount: items?.[0]?.count ?? 0,
    createdAt: o.created_at as string,
    customerName: customer?.full_name ?? null,
    addressLine: addressParts.length > 0 ? addressParts.join(", ") : null,
  };
}

/** Lista los pedidos del comercio activo (RLS filtra por tenant). */
export async function listOrders(
  opts: { limit?: number } = {},
): Promise<OrderListItem[]> {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("orders")
    .select(
      "id, channel, status, total, created_at, address_snapshot, order_items(count), customers(full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 50);

  return ((data ?? []) as Array<Record<string, unknown>>).map(mapOrder);
}

/** Pedidos activos para la pantalla de cocina (KDS). */
export async function getKitchenOrders(): Promise<OrderListItem[]> {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("orders")
    .select(
      "id, channel, status, total, created_at, address_snapshot, order_items(count), customers(full_name)",
    )
    .in("status", ["recibido", "en_preparacion", "listo"])
    .order("created_at", { ascending: true });

  return ((data ?? []) as Array<Record<string, unknown>>).map(mapOrder);
}
