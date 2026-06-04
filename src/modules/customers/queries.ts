import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CustomerSummary {
  ordersCount: number;
  totalSpent: number;
  customers: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  }[];
}

/**
 * Resumen de clientes del comercio activo.
 * RLS (`customers_org_select`) limita a clientes con pedidos en esta org.
 */
export async function getCustomerSummary(): Promise<CustomerSummary> {
  const db = await createSupabaseServerClient();

  const [{ data: orders }, { data: customers }] = await Promise.all([
    db.from("orders").select("total, customer_id"),
    db.from("customers").select("id, full_name, email, phone"),
  ]);

  const orderRows = (orders ?? []) as Array<Record<string, unknown>>;
  const totalSpent = orderRows.reduce((acc, o) => acc + Number(o.total), 0);

  return {
    ordersCount: orderRows.length,
    totalSpent,
    customers: ((customers ?? []) as Array<Record<string, unknown>>).map((c) => ({
      id: c.id as string,
      name: (c.full_name as string | null) ?? null,
      email: (c.email as string | null) ?? null,
      phone: (c.phone as string | null) ?? null,
    })),
  };
}
