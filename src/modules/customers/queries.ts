import "server-only";

import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrg } from "@/modules/auth/guards";

export interface CustomerAddress {
  id: string;
  label: string | null;
  line1: string;
  city: string | null;
  lat: number | null;
  lng: number | null;
  notes: string | null;
  isDefault: boolean;
}

export interface CommerceCustomerRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}

/** Resumen de clientes del comercio activo (vía pedidos). */
export async function getCustomerSummary(): Promise<{
  customers: CommerceCustomerRow[];
  ordersCount: number;
  totalSpent: number;
}> {
  await requireOrg();
  const db = await createSupabaseServerClient();

  const { data: orders } = await db
    .from("orders")
    .select("customer_id, total")
    .not("customer_id", "is", null);

  const orderRows = (orders ?? []) as Array<{
    customer_id: string;
    total: number;
  }>;
  const customerIds = [...new Set(orderRows.map((o) => o.customer_id))];

  let customers: CommerceCustomerRow[] = [];
  if (customerIds.length > 0) {
    const { data: cust } = await db
      .from("customers")
      .select("id, full_name, email, phone")
      .in("id", customerIds);
    customers = ((cust ?? []) as Array<Record<string, unknown>>).map((c) => ({
      id: c.id as string,
      name: (c.full_name as string | null) ?? null,
      email: (c.email as string | null) ?? null,
      phone: (c.phone as string | null) ?? null,
    }));
  }

  return {
    customers,
    ordersCount: orderRows.length,
    totalSpent: orderRows.reduce((acc, o) => acc + Number(o.total ?? 0), 0),
  };
}

export interface MyInvoiceItem {
  id: string;
  fullNumber: string;
  status: string;
  total: number;
  cufe: string | null;
  issuedAt: string | null;
}

async function getCustomerId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("customers")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

export async function listMyAddresses(): Promise<CustomerAddress[]> {
  const customerId = await getCustomerId();
  if (!customerId) return [];

  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("customer_addresses")
    .select("id, label, line1, city, lat, lng, notes, is_default")
    .eq("customer_id", customerId)
    .order("is_default", { ascending: false });

  return ((data ?? []) as Array<Record<string, unknown>>).map((a) => ({
    id: a.id as string,
    label: (a.label as string | null) ?? null,
    line1: a.line1 as string,
    city: (a.city as string | null) ?? null,
    lat: (a.lat as number | null) ?? null,
    lng: (a.lng as number | null) ?? null,
    notes: (a.notes as string | null) ?? null,
    isDefault: Boolean(a.is_default),
  }));
}

/** Facturas de pedidos del cliente (RLS invoices_customer_select). */
export async function getMyInvoices(): Promise<MyInvoiceItem[]> {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("invoices")
    .select("id, full_number, status, total, cufe, issued_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return ((data ?? []) as Array<Record<string, unknown>>).map((i) => ({
    id: i.id as string,
    fullNumber: i.full_number as string,
    status: i.status as string,
    total: Number(i.total ?? 0),
    cufe: (i.cufe as string | null) ?? null,
    issuedAt: (i.issued_at as string | null) ?? null,
  }));
}
