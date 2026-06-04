import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CashSessionView {
  id: string;
  registerId: string;
  registerName: string;
  openedBy: string | null;
  openingAmount: number;
  openedAt: string;
  status: string;
  salesTotal: number;
  cashIn: number;
  cashOut: number;
  expectedAmount: number;
}

/** Sesión de caja abierta del comercio activo (si existe). */
export async function getActiveCashSession(): Promise<CashSessionView | null> {
  const db = await createSupabaseServerClient();

  const { data: session } = await db
    .from("cash_sessions")
    .select("id, register_id, opened_by, opening_amount, opened_at, status")
    .eq("status", "open")
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!session) return null;
  const s = session as Record<string, unknown>;
  const sessionId = s.id as string;

  const [{ data: register }, { data: movements }] = await Promise.all([
    db.from("cash_registers").select("name").eq("id", s.register_id as string).maybeSingle(),
    db.from("cash_movements").select("type, amount").eq("cash_session_id", sessionId),
  ]);

  let salesTotal = 0;
  let cashIn = 0;
  let cashOut = 0;
  for (const m of (movements ?? []) as Array<Record<string, unknown>>) {
    const amount = Number(m.amount ?? 0);
    switch (m.type) {
      case "sale":
        salesTotal += amount;
        break;
      case "in":
        cashIn += amount;
        break;
      case "out":
      case "withdrawal":
        cashOut += amount;
        break;
    }
  }

  const opening = Number(s.opening_amount ?? 0);
  return {
    id: sessionId,
    registerId: s.register_id as string,
    registerName: ((register as Record<string, unknown> | null)?.name as string) ?? "Caja",
    openedBy: (s.opened_by as string | null) ?? null,
    openingAmount: opening,
    openedAt: s.opened_at as string,
    status: s.status as string,
    salesTotal,
    cashIn,
    cashOut,
    expectedAmount: opening + salesTotal + cashIn - cashOut,
  };
}
