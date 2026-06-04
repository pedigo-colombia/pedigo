"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CustomerActionResult {
  ok: boolean;
  message: string;
}

const addressSchema = z.object({
  label: z.string().max(40).optional(),
  line1: z.string().min(3, "Dirección obligatoria").max(200),
  city: z.string().max(80).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  notes: z.string().max(200).optional(),
  isDefault: z.boolean().optional(),
});

async function requireCustomerId(): Promise<string | null> {
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

export async function saveAddress(
  input: unknown,
  addressId?: string,
): Promise<CustomerActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return { ok: false, message: "No autenticado." };

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const d = parsed.data;
  const db = await createSupabaseServerClient();

  if (d.isDefault) {
    await db
      .from("customer_addresses")
      .update({ is_default: false } as never)
      .eq("customer_id", customerId);
  }

  const row = {
    customer_id: customerId,
    label: d.label ?? null,
    line1: d.line1,
    city: d.city ?? null,
    lat: d.lat ?? null,
    lng: d.lng ?? null,
    notes: d.notes ?? null,
    is_default: d.isDefault ?? false,
  };

  if (addressId) {
    const { error } = await db
      .from("customer_addresses")
      .update(row as never)
      .eq("id", addressId)
      .eq("customer_id", customerId);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await db.from("customer_addresses").insert(row as never);
    if (error) return { ok: false, message: error.message };
  }

  revalidatePath("/direcciones");
  return { ok: true, message: addressId ? "Dirección actualizada." : "Dirección guardada." };
}

export async function deleteAddress(addressId: string): Promise<CustomerActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return { ok: false, message: "No autenticado." };

  const db = await createSupabaseServerClient();
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
  const customerId = await requireCustomerId();
  if (!customerId) return { ok: false, message: "No autenticado." };

  const db = await createSupabaseServerClient();
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
