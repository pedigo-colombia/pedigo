import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrg } from "@/modules/auth/guards";
import { ensureCustomerId } from "./ensure-customer";
import {
  ADDRESS_SELECT_FULL,
  ADDRESS_SELECT_LEGACY,
  isDivisionColumnError,
  mapAddressRow,
} from "./address-db";

export interface CustomerAddress {
  id: string;
  label: string | null;
  line1: string;
  city: string | null;
  department: string | null;
  municipality: string | null;
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

export async function listMyAddresses(): Promise<CustomerAddress[]> {
  const ensured = await ensureCustomerId();
  if (!ensured.ok) return [];

  const db = createSupabaseAdminClient();
  let result = await db
    .from("customer_addresses")
    .select(ADDRESS_SELECT_FULL)
    .eq("customer_id", ensured.customerId)
    .order("is_default", { ascending: false });

  if (result.error && isDivisionColumnError(result.error.message)) {
    result = await db
      .from("customer_addresses")
      .select(ADDRESS_SELECT_LEGACY)
      .eq("customer_id", ensured.customerId)
      .order("is_default", { ascending: false });
  }

  return ((result.data ?? []) as Array<Record<string, unknown>>).map(mapAddressRow);
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
