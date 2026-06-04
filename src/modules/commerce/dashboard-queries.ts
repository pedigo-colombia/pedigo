import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrg } from "@/modules/auth/guards";
import type { FiscalUiStatus } from "@/components/brand/fiscal-status-banner";

export interface CommerceDashboardData {
  greetingName: string;
  salesToday: number;
  ordersToday: number;
  deliveriesToday: number;
  invoicesToday: number;
  fiscalStatus: FiscalUiStatus;
  pendingOrders: number;
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getCommerceDashboard(
  userFirstName?: string | null,
): Promise<CommerceDashboardData> {
  await requireOrg();
  const db = await createSupabaseServerClient();
  const since = startOfTodayIso();

  const [{ data: orders }, { data: invoices }, { data: fiscal }] = await Promise.all([
    db
      .from("orders")
      .select("total, status, address_snapshot")
      .gte("created_at", since),
    db.from("invoices").select("id, status").gte("created_at", since),
    db
      .from("organization_fiscal_settings")
      .select("nit, legal_name, dian_environment")
      .maybeSingle(),
  ]);

  const orderRows = (orders ?? []) as Array<{
    total: number;
    status: string;
    address_snapshot: unknown;
  }>;
  const cancelled = new Set(["cancelado", "rechazado"]);
  const activeOrders = orderRows.filter((o) => !cancelled.has(o.status));

  const salesToday = activeOrders.reduce((acc, o) => acc + Number(o.total ?? 0), 0);
  const deliveriesToday = activeOrders.filter((o) => o.address_snapshot != null).length;

  const invoiceRows = (invoices ?? []) as Array<{ status: string }>;
  const rejected = invoiceRows.filter((i) => i.status === "rejected").length;
  const issued = invoiceRows.filter((i) =>
    ["issued", "accepted"].includes(i.status),
  ).length;

  const fiscalRow = fiscal as {
    nit?: string;
    legal_name?: string;
    dian_environment?: string;
  } | null;

  let fiscalStatus: FiscalUiStatus = "process";
  if (rejected > 0) fiscalStatus = "error";
  else if (
    fiscalRow?.nit &&
    fiscalRow.nit.length > 3 &&
    (issued > 0 || fiscalRow.dian_environment === "production")
  ) {
    fiscalStatus = "active";
  }

  const { count: pending } = await db
    .from("orders")
    .select("id", { count: "exact", head: true })
    .in("status", ["recibido", "en_preparacion", "listo", "en_camino"]);

  return {
    greetingName: userFirstName?.trim() || "equipo",
    salesToday,
    ordersToday: activeOrders.length,
    deliveriesToday,
    invoicesToday: issued,
    fiscalStatus,
    pendingOrders: pending ?? 0,
  };
}
