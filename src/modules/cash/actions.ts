"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrg, requirePermission } from "@/modules/auth/guards";

export interface CashActionResult {
  ok: boolean;
  message: string;
}

const openSchema = z.object({
  openingAmount: z.number().min(0),
  registerName: z.string().min(1).default("Caja 1"),
});

const movementSchema = z.object({
  sessionId: z.string().uuid(),
  type: z.enum(["in", "out", "withdrawal"]),
  amount: z.number().positive(),
  notes: z.string().optional(),
});

const closeSchema = z.object({
  sessionId: z.string().uuid(),
  countedAmount: z.number().min(0),
});

/** Abre una sesión de caja (crea el registro si no existe). */
export async function openCashSession(
  input: z.infer<typeof openSchema>,
): Promise<CashActionResult> {
  const session = await requirePermission("cash.open_session");
  const parsed = openSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Datos inválidos" };

  const org = await requireOrg();
  const db = await createSupabaseServerClient();

  const existing = await db
    .from("cash_sessions")
    .select("id")
    .eq("status", "open")
    .limit(1)
    .maybeSingle();
  if (existing.data) {
    return { ok: false, message: "Ya hay una caja abierta." };
  }

  let registerId: string;
  const reg = await db
    .from("cash_registers")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (reg.data) {
    registerId = (reg.data as { id: string }).id;
  } else {
    const created = (await db
      .from("cash_registers")
      .insert({
        organization_id: org.organizationId,
        name: parsed.data.registerName,
      } as never)
      .select("id")
      .single()) as {
      data: { id: string } | null;
      error: { message: string } | null;
    };
    if (!created.data) {
      return {
        ok: false,
        message: created.error?.message ?? "No se pudo crear la caja",
      };
    }
    registerId = created.data.id;
  }

  const { error } = await db.from("cash_sessions").insert({
    organization_id: org.organizationId,
    register_id: registerId,
    opened_by: session.clerkUserId,
    opening_amount: parsed.data.openingAmount,
    status: "open",
  } as never);

  if (error) return { ok: false, message: error.message };
  revalidatePath("/caja");
  return { ok: true, message: "Caja abierta." };
}

/** Registra un movimiento de caja (ingreso/egreso/retiro). */
export async function addCashMovement(
  input: z.infer<typeof movementSchema>,
): Promise<CashActionResult> {
  await requirePermission("cash.open_session");
  const parsed = movementSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Datos inválidos" };

  const org = await requireOrg();
  const db = await createSupabaseServerClient();

  const { error } = await db.from("cash_movements").insert({
    organization_id: org.organizationId,
    cash_session_id: parsed.data.sessionId,
    type: parsed.data.type,
    amount: parsed.data.amount,
    notes: parsed.data.notes ?? null,
  } as never);

  if (error) return { ok: false, message: error.message };
  revalidatePath("/caja");
  return { ok: true, message: "Movimiento registrado." };
}

/** Cierra la caja con arqueo (calcula diferencia esperado vs contado). */
export async function closeCashSession(
  input: z.infer<typeof closeSchema>,
): Promise<CashActionResult> {
  await requirePermission("cash.close_session");
  const parsed = closeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Datos inválidos" };

  const db = await createSupabaseServerClient();
  const { sessionId, countedAmount } = parsed.data;

  // Recalcula el esperado a partir de los movimientos.
  const { data: s } = await db
    .from("cash_sessions")
    .select("opening_amount")
    .eq("id", sessionId)
    .single();
  const { data: movements } = await db
    .from("cash_movements")
    .select("type, amount")
    .eq("cash_session_id", sessionId);

  let expected = Number((s as { opening_amount?: number } | null)?.opening_amount ?? 0);
  for (const m of (movements ?? []) as Array<Record<string, unknown>>) {
    const amount = Number(m.amount ?? 0);
    if (m.type === "sale" || m.type === "in") expected += amount;
    if (m.type === "out" || m.type === "withdrawal") expected -= amount;
  }

  const { error } = await db
    .from("cash_sessions")
    .update({
      status: "closed",
      closing_amount: countedAmount,
      expected_amount: expected,
      difference: countedAmount - expected,
      closed_at: new Date().toISOString(),
    } as never)
    .eq("id", sessionId);

  if (error) return { ok: false, message: error.message };
  revalidatePath("/caja");
  return {
    ok: true,
    message: `Caja cerrada. Diferencia: ${countedAmount - expected}`,
  };
}
