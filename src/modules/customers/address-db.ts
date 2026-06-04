import "server-only";

/** Supabase/PostgREST aún no tiene columnas department/municipality (migración 0008). */
export function isDivisionColumnError(message: string | undefined): boolean {
  if (!message) return false;
  return /department|municipality|schema cache/i.test(message);
}

export interface AddressFormData {
  label?: string | null;
  line1: string;
  city?: string | null;
  department?: string | null;
  municipality: string;
  lat?: number | null;
  lng?: number | null;
  notes?: string | null;
  isDefault?: boolean;
}

export function buildAddressRows(customerId: string, d: AddressFormData) {
  const municipality = d.municipality ?? d.city ?? null;
  const base = {
    customer_id: customerId,
    label: d.label ?? null,
    line1: d.line1,
    lat: d.lat ?? null,
    lng: d.lng ?? null,
    notes: d.notes ?? null,
    is_default: d.isDefault ?? false,
  };

  const full = {
    ...base,
    city: municipality,
    department: d.department ?? null,
    municipality,
  };

  const legacyCity = [municipality, d.department].filter(Boolean).join(", ") || municipality;

  const legacy = {
    ...base,
    city: legacyCity,
  };

  return { full, legacy };
}

export const ADDRESS_SELECT_FULL =
  "id, label, line1, city, department, municipality, lat, lng, notes, is_default";
export const ADDRESS_SELECT_LEGACY =
  "id, label, line1, city, lat, lng, notes, is_default";

export function mapAddressRow(a: Record<string, unknown>) {
  const municipality =
    (a.municipality as string | null) ?? null;
  const department = (a.department as string | null) ?? null;
  let city = (a.city as string | null) ?? null;

  if (!municipality && !department && city?.includes(",")) {
    const parts = city.split(",").map((s) => s.trim());
    if (parts.length >= 2) {
      return {
        id: a.id as string,
        label: (a.label as string | null) ?? null,
        line1: a.line1 as string,
        city: parts[0] ?? city,
        department: parts.slice(1).join(", ") || null,
        municipality: parts[0] ?? null,
        lat: (a.lat as number | null) ?? null,
        lng: (a.lng as number | null) ?? null,
        notes: (a.notes as string | null) ?? null,
        isDefault: Boolean(a.is_default),
      };
    }
  }

  return {
    id: a.id as string,
    label: (a.label as string | null) ?? null,
    line1: a.line1 as string,
    city,
    department,
    municipality: municipality ?? city,
    lat: (a.lat as number | null) ?? null,
    lng: (a.lng as number | null) ?? null,
    notes: (a.notes as string | null) ?? null,
    isDefault: Boolean(a.is_default),
  };
}
