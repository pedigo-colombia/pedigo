/* eslint-disable no-console */
/**
 * Seed SEGURO para desarrollo local.
 *
 * A diferencia de `seed.ts`, este script:
 *  - NO borra ni recrea tu organización real (la creada desde la app), por lo
 *    que conserva el vínculo con Clerk (clerk_org_id real).
 *  - Llena tu org real con categorías, productos, inventario, caja, pedidos,
 *    facturas y un cliente demo.
 *  - Crea además 4 comercios demo + repartidores + tracking para que las vistas
 *    globales del Superadmin (Mapa global, Comercios) se vean ricas.
 *
 * Uso: npx tsx supabase/seed/seed-safe.ts   (ejecutar una sola vez)
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local",
  );
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

const rand = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(arr: T[]) => arr[rand(arr.length)];

const PRODUCT_WORDS = [
  "Especial", "Clásica", "Premium", "Mixta", "Familiar", "Personal",
  "Doble", "Tropical", "Picante", "Suave", "Criolla", "Vegetariana",
];
const CHANNELS = ["app", "pos", "whatsapp"] as const;
const STATUSES = [
  "recibido", "en_preparacion", "listo", "en_camino", "entregado",
] as const;

// Comercios demo ADICIONALES (no incluye pizzeria-roma para no tocar el real).
const EXTRA_COMMERCES = [
  { name: "Burger House", slug: "burger-house", prefix: "FB" },
  { name: "Sushi Nori", slug: "sushi-nori", prefix: "FS" },
  { name: "Arepas El Paisa", slug: "arepas-el-paisa", prefix: "FA" },
  { name: "Café Central", slug: "cafe-central", prefix: "FC" },
];

interface SeededOrg {
  id: string;
  slug: string;
  name: string;
}

/** Inserta los datos hijos (productos, pedidos, caja, etc.) en una org existente. */
async function seedChildren(org: SeededOrg, index: number) {
  const orgId = org.id;

  const { data: loc } = await db
    .from("commerce_locations")
    .insert({
      organization_id: orgId,
      name: "Sede principal",
      address: `Calle ${10 + index} #${index}-${index}`,
      lat: 4.65 + index * 0.01,
      lng: -74.05 - index * 0.01,
    })
    .select()
    .single();

  const catNames = ["Entradas", "Platos fuertes", "Bebidas", "Postres"];
  const { data: cats } = await db
    .from("product_categories")
    .insert(catNames.map((name, i) => ({ organization_id: orgId, name, sort_order: i })))
    .select();

  const products = Array.from({ length: 25 }).map((_, i) => ({
    organization_id: orgId,
    category_id: cats ? pick(cats).id : null,
    name: `${org.name.split(" ")[0]} ${pick(PRODUCT_WORDS)} ${i + 1}`,
    base_price: (rand(40) + 6) * 1000,
    is_favorite: i < 5,
    tax_rate: 0.19,
  }));
  const { data: insertedProducts } = await db
    .from("products")
    .insert(products)
    .select();

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

  const { data: customer } = await db
    .from("customers")
    .insert({
      clerk_user_id: `seed_cust_${org.slug}`,
      email: `cliente.${org.slug}@demo.pedigo.lat`,
      full_name: `Cliente ${org.name}`,
    })
    .select()
    .single();
  if (customer) {
    await db.from("customer_addresses").insert({
      customer_id: customer.id,
      label: "Casa",
      line1: `Carrera ${index + 5} #${index}-${index}`,
      city: "Bogotá",
      lat: 4.66 + index * 0.01,
      lng: -74.06 - index * 0.01,
      is_default: true,
    });
  }

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
      opened_by: `seed_emp_${org.slug}`,
      opening_amount: 100000,
      status: "open",
    })
    .select()
    .single();

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
}

/** Crea un comercio demo nuevo (org + settings + fiscal + secuencias). */
async function createExtraCommerce(
  c: (typeof EXTRA_COMMERCES)[number],
  index: number,
): Promise<SeededOrg> {
  // Limpia un posible comercio demo previo con el mismo slug.
  const { data: existing } = await db
    .from("organizations")
    .select("id")
    .eq("slug", c.slug)
    .maybeSingle();
  if (existing?.id) {
    await db.from("organizations").delete().eq("id", existing.id);
  }

  const { data: org, error } = await db
    .from("organizations")
    .insert({ name: c.name, slug: c.slug, clerk_org_id: `seed_${c.slug}` })
    .select()
    .single();
  if (error || !org) throw error ?? new Error("No se pudo crear comercio demo");
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

  return { id: orgId, slug: c.slug, name: c.name };
}

async function seedCouriers(orgIds: string[]) {
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
        current_lat: 4.66 + i * 0.01,
        current_lng: -74.06 - i * 0.01,
      })),
    )
    .select();
  if (!inserted) return [];

  await db.from("courier_organization_links").insert([
    { courier_id: inserted[0].id, organization_id: orgIds[0], relationship: "owned" },
    { courier_id: inserted[1].id, organization_id: orgIds[1] ?? orgIds[0], relationship: "owned" },
  ]);
  await db.from("courier_organization_links").insert(
    orgIds.map((orgId) => ({
      courier_id: inserted[2].id,
      organization_id: orgId,
      relationship: "shared" as const,
    })),
  );

  await db.from("live_locations").insert(
    inserted.flatMap((c, ci) =>
      Array.from({ length: 5 }).map((_, t) => ({
        courier_id: c.id,
        lat: 4.66 + ci * 0.01 + t * 0.001,
        lng: -74.06 - ci * 0.01 - t * 0.001,
        heading: rand(360),
        speed: 20 + rand(20),
      })),
    ),
  );

  return inserted.map((c) => c.id as string);
}

async function seedDeliveries(orgs: SeededOrg[], courierIds: string[]) {
  const sharedCourier = courierIds[courierIds.length - 1];

  for (let i = 0; i < orgs.length; i++) {
    const orgId = orgs[i].id;
    const courierId = courierIds[i] ?? sharedCourier;

    const { data: customer } = await db
      .from("customers")
      .select("id")
      .eq("clerk_user_id", `seed_cust_${orgs[i].slug}`)
      .maybeSingle();

    const destLat = 4.67 + i * 0.01;
    const destLng = -74.07 - i * 0.01;

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

    await db.from("live_locations").insert(
      Array.from({ length: 6 }).map((_, t) => ({
        courier_id: courierId,
        order_id: order.id,
        lat: 4.65 + i * 0.01 + t * 0.003,
        lng: -74.05 - i * 0.01 - t * 0.003,
        heading: rand(360),
        speed: 25,
      })),
    );

    await db
      .from("couriers")
      .update({ current_lat: 4.65 + i * 0.01 + 0.015, current_lng: -74.05 - i * 0.01 - 0.015 })
      .eq("id", courierId);
  }
}

async function main() {
  console.log("Sembrando datos demo (modo seguro)…");

  // 1. Detectar la org REAL (creada desde la app; clerk_org_id no empieza por "seed_").
  const { data: realOrgs, error: realErr } = await db
    .from("organizations")
    .select("id,name,slug,clerk_org_id")
    .not("clerk_org_id", "like", "seed_%")
    .order("created_at", { ascending: true });
  if (realErr) throw realErr;
  if (!realOrgs || realOrgs.length === 0) {
    console.error(
      "No se encontró ninguna organización real. Crea tu comercio desde /admin/comercios primero.",
    );
    process.exit(1);
  }
  const mainOrg = realOrgs[0] as SeededOrg;
  console.log(`  → Org real detectada: ${mainOrg.name} (${mainOrg.slug})`);

  // 2. Sembrar hijos en la org real (conserva su vínculo con Clerk).
  await seedChildren(mainOrg, 0);
  console.log(`  ✓ ${mainOrg.name} (tu comercio) poblado`);

  // 3. Crear los comercios demo adicionales.
  const allOrgs: SeededOrg[] = [mainOrg];
  for (let i = 0; i < EXTRA_COMMERCES.length; i++) {
    const org = await createExtraCommerce(EXTRA_COMMERCES[i], i + 1);
    await seedChildren(org, i + 1);
    allOrgs.push(org);
    console.log(`  ✓ ${org.name} (demo)`);
  }

  // 4. Repartidores + tracking + entregas en curso.
  const orgIds = allOrgs.map((o) => o.id);
  const courierIds = await seedCouriers(orgIds);
  console.log("  ✓ Repartidores y tracking");
  await seedDeliveries(allOrgs, courierIds);
  console.log("  ✓ Entregas en curso (asignación + tracking por pedido)");

  console.log("Seed seguro completado.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
