/* eslint-disable no-console */
/**
 * Seed de prueba de PediGo (Fase 7).
 *
 * Genera datos de demo:
 *  - 5 comercios (+ settings, fiscal y secuencias)
 *  - categorías y 25 productos por comercio
 *  - usuarios espejo, clientes y direcciones
 *  - repartidores (propios y compartidos)
 *  - pedidos de ejemplo en varios estados/canales
 *  - sesiones y movimientos de caja
 *  - facturas simuladas (numeración consecutiva)
 *  - tracking simulado (live_locations)
 *
 * Uso:
 *   1) Completa .env.local (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
 *   2) Asegúrate de haber corrido las migraciones 0001 y 0002
 *   3) npm run db:seed
 *
 * Usa service_role (bypassa RLS): SOLO para entornos de desarrollo.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

import {
  MONTERIA_CENTER,
  MONTERIA_COMMERCES,
  productImageFor,
  productNameFor,
} from "./monteria-data";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local",
  );
  process.exit(1);
}

const db = createClient(url, key, {
  auth: { persistSession: false },
});

const rand = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(arr: T[]) => arr[rand(arr.length)];

const COMMERCES = [...MONTERIA_COMMERCES];

const PRODUCT_WORDS = [
  "Especial", "Clásica", "Premium", "Mixta", "Familiar", "Personal",
  "Doble", "Tropical", "Picante", "Suave", "Criolla", "Vegetariana",
];
const CHANNELS = ["app", "pos", "whatsapp"] as const;
const STATUSES = [
  "recibido", "en_preparacion", "listo", "en_camino", "entregado",
] as const;

async function clearForSlug(slug: string) {
  const { data } = await db
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (data?.id) {
    await db.from("organizations").delete().eq("id", data.id);
  }
}

async function seedCommerce(c: (typeof COMMERCES)[number], index: number) {
  await clearForSlug(c.slug);

  const { data: org, error } = await db
    .from("organizations")
    .insert({
      name: c.name,
      slug: c.slug,
      status: "active",
      clerk_org_id: `seed_${c.slug}`,
    })
    .select()
    .single();
  if (error || !org) throw error ?? new Error("org");
  const orgId = org.id as string;

  await db.from("organization_settings").insert({ organization_id: orgId });
  await db.from("organization_fiscal_settings").insert({
    organization_id: orgId,
    legal_name: `${c.name} S.A.S.`,
    nit: `90012345${index}-1`,
    invoice_prefix: c.prefix,
  });
  await db.from("fiscal_sequences").insert([
    { organization_id: orgId, doc_type: "invoice", prefix: c.prefix, current_number: 0 },
    { organization_id: orgId, doc_type: "credit_note", prefix: "NC", current_number: 0 },
    { organization_id: orgId, doc_type: "debit_note", prefix: "ND", current_number: 0 },
    { organization_id: orgId, doc_type: "support_document", prefix: "DS", current_number: 0 },
  ]);

  const { data: loc } = await db
    .from("commerce_locations")
    .insert({
      organization_id: orgId,
      name: "Sede principal",
      address: c.address,
      lat: c.lat,
      lng: c.lng,
      is_main: true,
    })
    .select()
    .single();

  // Categorías
  const catNames = ["Entradas", "Platos fuertes", "Bebidas", "Postres"];
  const { data: cats } = await db
    .from("product_categories")
    .insert(catNames.map((name, i) => ({ organization_id: orgId, name, sort_order: i })))
    .select();

  // 25 productos con imagen
  const products = Array.from({ length: 25 }).map((_, i) => ({
    organization_id: orgId,
    category_id: cats ? pick(cats).id : null,
    name: productNameFor(c.menuTheme, i),
    description: `Especialidad de ${c.name}`,
    image_url: productImageFor(c.menuTheme, i),
    base_price: (rand(40) + 6) * 1000,
    is_favorite: i < 5,
    tax_rate: 0.19,
  }));
  const { data: insertedProducts } = await db
    .from("products")
    .insert(products)
    .select();

  // Inventario
  if (insertedProducts) {
    await db.from("inventory_items").insert(
      insertedProducts.map((p) => ({
        organization_id: orgId,
        product_id: p.id,
        stock_qty: rand(100) + 10,
        min_alert: 5,
      })),
    );
  }

  // Cliente demo + dirección
  const { data: customer } = await db
    .from("customers")
    .insert({
      clerk_user_id: `seed_cust_${c.slug}`,
      email: `cliente.${c.slug}@demo.pedigo.lat`,
      full_name: `Cliente ${c.name}`,
    })
    .select()
    .single();
  if (customer) {
    await db.from("customer_addresses").insert({
      customer_id: customer.id,
      label: "Casa",
      line1: `Calle 41 #${6 + index}-${20 + index}, Montería`,
      city: "Montería",
      department: "Córdoba",
      municipality: "Montería",
      lat: MONTERIA_CENTER.lat + (index - 2) * 0.001,
      lng: MONTERIA_CENTER.lng + (index - 2) * 0.001,
      is_default: true,
    });
  }

  // Caja
  const { data: register } = await db
    .from("cash_registers")
    .insert({ organization_id: orgId, location_id: loc?.id ?? null, name: "Caja 1" })
    .select()
    .single();
  const { data: session } = await db
    .from("cash_sessions")
    .insert({
      organization_id: orgId,
      register_id: register!.id,
      opened_by: `seed_emp_${c.slug}`,
      opening_amount: 100000,
      status: "open",
    })
    .select()
    .single();

  // Pedidos + items + historial + caja + factura simulada
  for (let i = 0; i < 6; i++) {
    const status = pick([...STATUSES]);
    const channel = pick([...CHANNELS]);
    const chosen = insertedProducts ? insertedProducts.slice(0, 3) : [];
    const subtotal = chosen.reduce((acc, p) => acc + Number(p.base_price), 0);
    const tax = Math.round(subtotal * 0.19);
    const total = subtotal + tax;

    const { data: order } = await db
      .from("orders")
      .insert({
        organization_id: orgId,
        customer_id: customer?.id ?? null,
        location_id: loc?.id ?? null,
        channel,
        status,
        subtotal,
        tax_total: tax,
        total,
      })
      .select()
      .single();
    if (!order) continue;

    await db.from("order_items").insert(
      chosen.map((p) => ({
        order_id: order.id,
        organization_id: orgId,
        product_id: p.id,
        qty: 1,
        unit_price: p.base_price,
        line_total: p.base_price,
      })),
    );
    await db.from("order_status_history").insert({
      order_id: order.id,
      organization_id: orgId,
      to_status: status,
    });

    if (status === "entregado") {
      await db.from("cash_movements").insert({
        organization_id: orgId,
        cash_session_id: session!.id,
        type: "sale",
        amount: total,
        ref_order_id: order.id,
      });

      const { data: seq } = await db.rpc("next_fiscal_number", {
        p_organization_id: orgId,
        p_doc_type: "invoice",
      });
      const numbering = Array.isArray(seq) ? seq[0] : seq;
      if (numbering) {
        await db.from("invoices").insert({
          organization_id: orgId,
          order_id: order.id,
          type: "sale",
          prefix: numbering.prefix,
          number: numbering.number,
          full_number: `${numbering.prefix}${numbering.number}`,
          status: "issued",
          subtotal,
          tax_total: tax,
          total,
          cufe: `MOCK-${order.id.replace(/-/g, "").slice(0, 24)}`,
          issued_at: new Date().toISOString(),
          customer_snapshot: { name: customer?.full_name ?? "Consumidor final" },
          fiscal_snapshot: { channel, total },
        });
      }
    }
  }

  return orgId;
}

async function seedCouriers(orgIds: string[]) {
  // 3 repartidores: 2 propios, 1 compartido entre todos.
  const couriers = [
    { full_name: "Carlos Mensajero", clerk_user_id: "seed_courier_1" },
    { full_name: "Laura Veloz", clerk_user_id: "seed_courier_2" },
    { full_name: "Andrés Compartido", clerk_user_id: "seed_courier_shared" },
  ];
  for (const c of couriers) {
    await db.from("couriers").delete().eq("clerk_user_id", c.clerk_user_id);
  }
  const { data: inserted } = await db
    .from("couriers")
    .insert(
      couriers.map((c, i) => ({
        ...c,
        vehicle_type: "moto",
        current_lat: MONTERIA_CENTER.lat + i * 0.002,
        current_lng: MONTERIA_CENTER.lng + i * 0.002,
      })),
    )
    .select();
  if (!inserted) return [];

  // Propios
  await db.from("courier_organization_links").insert([
    { courier_id: inserted[0].id, organization_id: orgIds[0], relationship: "owned" },
    { courier_id: inserted[1].id, organization_id: orgIds[1], relationship: "owned" },
  ]);
  // Compartido en todos
  await db.from("courier_organization_links").insert(
    orgIds.map((orgId) => ({
      courier_id: inserted[2].id,
      organization_id: orgId,
      relationship: "shared" as const,
    })),
  );

  // Tracking simulado (sin pedido) para poblar el mapa operativo.
  await db.from("live_locations").insert(
    inserted.flatMap((c, ci) =>
      Array.from({ length: 5 }).map((_, t) => ({
        courier_id: c.id,
        lat: MONTERIA_CENTER.lat + ci * 0.002 + t * 0.0003,
        lng: MONTERIA_CENTER.lng + ci * 0.002 + t * 0.0003,
        heading: rand(360),
        speed: 20 + rand(20),
      })),
    ),
  );

  return inserted.map((c) => c.id as string);
}

/** Crea una entrega en curso por comercio (asignación + tracking del pedido). */
async function seedDeliveries(orgIds: string[], courierIds: string[]) {
  const sharedCourier = courierIds[courierIds.length - 1];

  for (let i = 0; i < orgIds.length; i++) {
    const orgId = orgIds[i];
    const courierId = courierIds[i] ?? sharedCourier;

    const { data: customer } = await db
      .from("customers")
      .select("id")
      .eq("clerk_user_id", `seed_cust_${COMMERCES[i].slug}`)
      .maybeSingle();

    const destLat = MONTERIA_CENTER.lat + 0.003 + i * 0.001;
    const destLng = MONTERIA_CENTER.lng - 0.002 - i * 0.001;

    const { data: order } = await db
      .from("orders")
      .insert({
        organization_id: orgId,
        customer_id: customer?.id ?? null,
        channel: "app",
        status: "en_camino",
        subtotal: 30000,
        tax_total: 5700,
        total: 35700,
        courier_id: courierId,
        address_snapshot: {
          line1: `Calle ${20 + i} #${i}-${i}`,
          lat: destLat,
          lng: destLng,
        },
      })
      .select()
      .single();
    if (!order) continue;

    await db.from("courier_assignments").insert({
      organization_id: orgId,
      order_id: order.id,
      courier_id: courierId,
      method: "auto_proximity",
      status: "active",
    });

    await db.from("order_status_history").insert({
      order_id: order.id,
      organization_id: orgId,
      to_status: "en_camino",
    });

    // Trayecto acercándose al destino (ligado al pedido para el tracking).
    await db.from("live_locations").insert(
      Array.from({ length: 6 }).map((_, t) => ({
        courier_id: courierId,
        order_id: order.id,
        lat: MONTERIA_CENTER.lat - 0.002 + i * 0.001 + t * 0.0004,
        lng: MONTERIA_CENTER.lng + 0.001 - i * 0.001 - t * 0.0004,
        heading: rand(360),
        speed: 25,
      })),
    );

    // Última posición conocida del repartidor.
    await db
      .from("couriers")
      .update({
        current_lat: MONTERIA_CENTER.lat + i * 0.001 + 0.002,
        current_lng: MONTERIA_CENTER.lng - i * 0.001 - 0.002,
      })
      .eq("id", courierId);
  }
}

/** Slugs del seed antiguo (Bogotá) que se eliminan al migrar a Montería. */
const LEGACY_DEMO_SLUGS = [
  "pizzeria-roma",
  "burger-house",
  "sushi-tokyo",
  "cafe-moka",
  "pollo-frito-express",
  "tacos-mex",
];

async function main() {
  console.log("Sembrando datos de PediGo (Montería)…");
  for (const slug of LEGACY_DEMO_SLUGS) {
    await clearForSlug(slug);
  }
  const orgIds: string[] = [];
  for (let i = 0; i < COMMERCES.length; i++) {
    const id = await seedCommerce(COMMERCES[i], i);
    orgIds.push(id);
    console.log(`  ✓ ${COMMERCES[i].name}`);
  }
  const courierIds = await seedCouriers(orgIds);
  console.log("  ✓ Repartidores y tracking");
  await seedDeliveries(orgIds, courierIds);
  console.log("  ✓ Entregas en curso (asignación + tracking por pedido)");
  console.log("Seed completado.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
