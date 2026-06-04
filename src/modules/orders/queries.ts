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
}

function mapOrder(o: Record<string, unknown>): OrderListItem {
  const items = o.order_items as Array<{ count: number }> | undefined;
  return {
    id: o.id as string,
    channel: o.channel as OrderChannel,
    status: o.status as OrderStatus,
    total: Number(o.total ?? 0),
    itemCount: items?.[0]?.count ?? 0,
    createdAt: o.created_at as string,
  };
}

/** Lista los pedidos del comercio activo (RLS filtra por tenant). */
export async function listOrders(
  opts: { limit?: number } = {},
): Promise<OrderListItem[]> {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("orders")
    .select("id, channel, status, total, created_at, order_items(count)")
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 50);

  return ((data ?? []) as Array<Record<string, unknown>>).map(mapOrder);
}

/** Pedidos activos para la pantalla de cocina (KDS). */
export async function getKitchenOrders(): Promise<OrderListItem[]> {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("orders")
    .select("id, channel, status, total, created_at, order_items(count)")
    .in("status", ["recibido", "en_preparacion", "listo"])
    .order("created_at", { ascending: true });

  return ((data ?? []) as Array<Record<string, unknown>>).map(mapOrder);
}
