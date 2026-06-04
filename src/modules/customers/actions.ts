"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildAddressRows,
  isDivisionColumnError,
} from "./address-db";
import { ensureCustomerId } from "./ensure-customer";

export interface CustomerActionResult {
  ok: boolean;
  message: string;
}

const addressSchema = z.object({
  label: z.string().max(40).optional(),
  line1: z.string().min(3, "Dirección obligatoria").max(200),
  city: z.string().max(80).optional(),
  department: z.string().max(80).optional(),
  municipality: z.string().min(2, "Selecciona municipio").max(80),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  notes: z.string().max(200).optional(),
  isDefault: z.boolean().optional(),
});

async function persistAddress(
  customerId: string,
  d: z.infer<typeof addressSchema>,
  addressId?: string,
): Promise<CustomerActionResult> {
  const db = createSupabaseAdminClient();
  const { full, legacy } = buildAddressRows(customerId, d);

  const save = async (row: Record<string, unknown>) => {
    if (addressId) {
      return db
        .from("customer_addresses")
        .update(row as never)
        .eq("id", addressId)
        .eq("customer_id", customerId);
    }
    return db.from("customer_addresses").insert(row as never);
  };

  let { error } = await save(full);
  if (error && isDivisionColumnError(error.message)) {
    ({ error } = await save(legacy));
  }

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/direcciones");
  return {
    ok: true,
    message: addressId ? "Dirección actualizada." : "Dirección guardada.",
  };
}

export async function saveAddress(
  input: unknown,
  addressId?: string,
): Promise<CustomerActionResult> {
  const ensured = await ensureCustomerId();
  if (!ensured.ok) return { ok: false, message: ensured.message };
  const customerId = ensured.customerId;

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const d = parsed.data;

  if (d.isDefault) {
    const db = createSupabaseAdminClient();
    await db
      .from("customer_addresses")
      .update({ is_default: false } as never)
      .eq("customer_id", customerId);
  }

  return persistAddress(customerId, d, addressId);
}

export async function deleteAddress(addressId: string): Promise<CustomerActionResult> {
  const ensured = await ensureCustomerId();
  if (!ensured.ok) return { ok: false, message: ensured.message };
  const customerId = ensured.customerId;

  const db = createSupabaseAdminClient();
  const { error } = await db
    .from("customer_addresses")
    .delete()
    .eq("id", addressId)
    .eq("customer_id", customerId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/direcciones");
  return { ok: true, message: "Dirección eliminada." };
}

export async function setDefaultAddress(
  addressId: string,
): Promise<CustomerActionResult> {
  const ensured = await ensureCustomerId();
  if (!ensured.ok) return { ok: false, message: ensured.message };
  const customerId = ensured.customerId;

  const db = createSupabaseAdminClient();
  await db
    .from("customer_addresses")
    .update({ is_default: false } as never)
    .eq("customer_id", customerId);
  const { error } = await db
    .from("customer_addresses")
    .update({ is_default: true } as never)
    .eq("id", addressId)
    .eq("customer_id", customerId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/direcciones");
  return { ok: true, message: "Dirección predeterminada actualizada." };
}
