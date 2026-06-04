import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/modules/auth/guards";

/**
 * Ingesta de ubicación del repartidor (Fase 5).
 *
 * El courier envía su posición ~cada 5s. RLS garantiza que solo puede escribir
 * sus propias ubicaciones (policy `live_locations_courier`). Aquí validamos el
 * payload con Zod y delegamos el aislamiento a la base de datos.
 */
const locationSchema = z.object({
  courierId: z.string().uuid(),
  orderId: z.string().uuid().nullable().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  heading: z.number().optional(),
  speed: z.number().optional(),
});

export async function POST(req: Request) {
  try {
    await requireAuth();
  } catch {
    return new NextResponse("No autenticado", { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = locationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message },
      { status: 400 },
    );
  }

  const { courierId, orderId, lat, lng, heading, speed } = parsed.data;
  const db = await createSupabaseServerClient();

  const { error } = await db.from("live_locations").insert({
    courier_id: courierId,
    order_id: orderId ?? null,
    lat,
    lng,
    heading: heading ?? null,
    speed: speed ?? null,
  } as never);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  await db
    .from("couriers")
    .update({ current_lat: lat, current_lng: lng } as never)
    .eq("id", courierId);

  return NextResponse.json({ ok: true });
}
