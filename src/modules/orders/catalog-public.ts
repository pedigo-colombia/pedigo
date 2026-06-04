import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Catalog } from "@/modules/pos/types";

export interface CommerceListItem {
  id: string;
  name: string;
  slug: string;
}

/** Comercio activo con sede principal para mapa de descubrimiento. */
export interface CommerceDiscoveryItem extends CommerceListItem {
  lat: number;
  lng: number;
  address: string | null;
  locationName: string | null;
}

/** Comercios activos disponibles para pedir (lectura pública vía servidor). */
export async function listActiveCommerces(): Promise<CommerceListItem[]> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("organizations")
    .select("id, name, slug")
    .eq("status", "active")
    .order("name");

  return ((data ?? []) as Array<Record<string, unknown>>).map((o) => ({
    id: o.id as string,
    name: o.name as string,
    slug: o.slug as string,
  }));
}

/** Comercios con coordenadas de sede principal (home mapa cliente). */
export async function listActiveCommercesForDiscovery(): Promise<
  CommerceDiscoveryItem[]
> {
  const db = createSupabaseAdminClient();
  const { data: orgs } = await db
    .from("organizations")
    .select("id, name, slug")
    .eq("status", "active")
    .order("name");

  const organizations = (orgs ?? []) as Array<Record<string, unknown>>;
  if (organizations.length === 0) return [];

  const orgIds = organizations.map((o) => o.id as string);
  const { data: locations } = await db
    .from("commerce_locations")
    .select("organization_id, name, address, lat, lng, is_main")
    .in("organization_id", orgIds)
    .not("lat", "is", null)
    .not("lng", "is", null);

  const locRows = (locations ?? []) as Array<Record<string, unknown>>;
  const byOrg = new Map<string, Record<string, unknown>>();
  for (const loc of locRows) {
    const orgId = loc.organization_id as string;
    const existing = byOrg.get(orgId);
    if (!existing || (loc.is_main && !existing.is_main)) {
      byOrg.set(orgId, loc);
    }
  }

  const items: CommerceDiscoveryItem[] = [];
  for (const o of organizations) {
    const orgId = o.id as string;
    const loc = byOrg.get(orgId);
    if (!loc) continue;
    const lat = Number(loc.lat);
    const lng = Number(loc.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    items.push({
      id: orgId,
      name: o.name as string,
      slug: o.slug as string,
      lat,
      lng,
      address: (loc.address as string | null) ?? null,
      locationName: (loc.name as string | null) ?? null,
    });
  }
  return items;
}

export async function getCommerceBySlug(
  slug: string,
): Promise<CommerceListItem | null> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (!data) return null;
  const o = data as Record<string, unknown>;
  return { id: o.id as string, name: o.name as string, slug: o.slug as string };
}

/** Catálogo de un comercio por slug (precios validados en servidor al confirmar). */
export async function getCatalogByCommerceSlug(slug: string): Promise<{
  commerce: CommerceListItem;
  catalog: Catalog;
} | null> {
  const commerce = await getCommerceBySlug(slug);
  if (!commerce) return null;

  const db = createSupabaseAdminClient();
  const orgId = commerce.id;

  const [{ data: categories }, { data: products }, { data: variants }, { data: extras }] =
    await Promise.all([
      db
        .from("product_categories")
        .select("id, name, sort_order")
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .order("sort_order"),
      db
        .from("products")
        .select(
          "id, category_id, name, description, base_price, tax_rate, is_favorite, image_url",
        )
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .order("name"),
      db
        .from("product_variants")
        .select("id, product_id, name, price_delta")
        .eq("organization_id", orgId),
      db
        .from("product_extras")
        .select("id, product_id, name, price")
        .eq("organization_id", orgId)
        .eq("is_active", true),
    ]);

  const variantsByProduct = new Map<string, { id: string; name: string; priceDelta: number }[]>();
  for (const v of (variants ?? []) as Array<Record<string, unknown>>) {
    const pid = v.product_id as string;
    const list = variantsByProduct.get(pid) ?? [];
    list.push({
      id: v.id as string,
      name: v.name as string,
      priceDelta: Number(v.price_delta ?? 0),
    });
    variantsByProduct.set(pid, list);
  }

  const extrasByProduct = new Map<string, { id: string; name: string; price: number }[]>();
  for (const e of (extras ?? []) as Array<Record<string, unknown>>) {
    const pid = e.product_id as string;
    const list = extrasByProduct.get(pid) ?? [];
    list.push({
      id: e.id as string,
      name: e.name as string,
      price: Number(e.price ?? 0),
    });
    extrasByProduct.set(pid, list);
  }

  const mappedProducts = ((products ?? []) as Array<Record<string, unknown>>).map((p) => ({
    id: p.id as string,
    categoryId: (p.category_id as string | null) ?? null,
    name: p.name as string,
    description: (p.description as string | null) ?? null,
    basePrice: Number(p.base_price ?? 0),
    taxRate: Number(p.tax_rate ?? 0.19),
    isFavorite: Boolean(p.is_favorite),
    imageUrl: (p.image_url as string | null) ?? null,
    variants: variantsByProduct.get(p.id as string) ?? [],
    extras: extrasByProduct.get(p.id as string) ?? [],
  }));

  return {
    commerce,
    catalog: {
      categories: ((categories ?? []) as Array<Record<string, unknown>>).map((c) => ({
        id: c.id as string,
        name: c.name as string,
        sortOrder: Number(c.sort_order ?? 0),
      })),
      products: mappedProducts,
    },
  };
}
