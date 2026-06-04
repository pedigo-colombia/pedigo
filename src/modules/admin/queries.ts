import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireSuperadmin } from "@/modules/auth/guards";

export interface PlatformStats {
  organizations: number;
  users: number;
  couriers: number;
  invoices: number;
}

export interface PlatformUserRow {
  id: string;
  clerkUserId: string;
  email: string | null;
  fullName: string | null;
  platformRole: string | null;
  createdAt: string;
}

export interface GlobalMapCommerce {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface GlobalMapCourier {
  id: string;
  fullName: string;
  lat: number;
  lng: number;
  orgName: string;
}

export interface GlobalMapOrder {
  id: string;
  status: string;
  lat: number;
  lng: number;
  orgName: string;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  await requireSuperadmin();
  const db = createSupabaseAdminClient();

  const [orgs, users, couriers, invoices] = await Promise.all([
    db.from("organizations").select("id", { count: "exact", head: true }),
    db.from("users").select("id", { count: "exact", head: true }),
    db.from("couriers").select("id", { count: "exact", head: true }),
    db
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("status", "issued"),
  ]);

  return {
    organizations: orgs.count ?? 0,
    users: users.count ?? 0,
    couriers: couriers.count ?? 0,
    invoices: invoices.count ?? 0,
  };
}

export async function listPlatformUsers(): Promise<PlatformUserRow[]> {
  await requireSuperadmin();
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("users")
    .select("id, clerk_user_id, email, full_name, platform_role, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return ((data ?? []) as Array<Record<string, unknown>>).map((u) => ({
    id: u.id as string,
    clerkUserId: u.clerk_user_id as string,
    email: (u.email as string | null) ?? null,
    fullName: (u.full_name as string | null) ?? null,
    platformRole: (u.platform_role as string | null) ?? null,
    createdAt: u.created_at as string,
  }));
}

/** Datos agregados para el mapa global de superadmin. */
export async function getGlobalMapData(): Promise<{
  commerces: GlobalMapCommerce[];
  couriers: GlobalMapCourier[];
  orders: GlobalMapOrder[];
}> {
  await requireSuperadmin();
  const db = createSupabaseAdminClient();

  const { data: locations } = await db
    .from("commerce_locations")
    .select("id, name, lat, lng, organizations(name)");

  const commerces: GlobalMapCommerce[] = [];
  for (const row of (locations ?? []) as Array<Record<string, unknown>>) {
    if (row.lat == null || row.lng == null) continue;
    commerces.push({
      id: row.id as string,
      name: (row.organizations as { name?: string } | null)?.name ?? (row.name as string),
      lat: Number(row.lat),
      lng: Number(row.lng),
    });
  }

  const { data: links } = await db
    .from("courier_organization_links")
    .select(
      "couriers(id, full_name, current_lat, current_lng, is_active), organizations(name)",
    );

  const couriers: GlobalMapCourier[] = [];
  for (const row of (links ?? []) as Array<Record<string, unknown>>) {
    const c = row.couriers as Record<string, unknown> | null;
    if (!c || !c.is_active || c.current_lat == null || c.current_lng == null) continue;
    couriers.push({
      id: c.id as string,
      fullName: c.full_name as string,
      lat: Number(c.current_lat),
      lng: Number(c.current_lng),
      orgName: (row.organizations as { name?: string } | null)?.name ?? "—",
    });
  }

  const { data: orders } = await db
    .from("orders")
    .select("id, status, address_snapshot, organizations(name)")
    .in("status", ["listo", "en_camino"]);

  const orderMarkers: GlobalMapOrder[] = [];
  for (const row of (orders ?? []) as Array<Record<string, unknown>>) {
    const addr = row.address_snapshot as { lat?: number; lng?: number } | null;
    if (addr?.lat == null || addr?.lng == null) continue;
    orderMarkers.push({
      id: row.id as string,
      status: row.status as string,
      lat: addr.lat,
      lng: addr.lng,
      orgName: (row.organizations as { name?: string } | null)?.name ?? "—",
    });
  }

  return { commerces, couriers, orders: orderMarkers };
}
