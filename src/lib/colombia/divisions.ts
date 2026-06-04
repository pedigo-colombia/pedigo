import divisionsData from "@/data/colombia-divisions.json";

export interface ColombiaDepartment {
  id: number;
  name: string;
}

export interface ColombiaMunicipality {
  id: number;
  name: string;
}

const { departments, municipalities } = divisionsData as {
  departments: ColombiaDepartment[];
  municipalities: Record<string, ColombiaMunicipality[]>;
};

export function listDepartments(): ColombiaDepartment[] {
  return departments;
}

export function listMunicipalities(departmentId: number): ColombiaMunicipality[] {
  return municipalities[String(departmentId)] ?? [];
}

export function getDepartmentById(id: number): ColombiaDepartment | undefined {
  return departments.find((d) => d.id === id);
}

export function getMunicipalityById(
  departmentId: number,
  municipalityId: number,
): ColombiaMunicipality | undefined {
  return listMunicipalities(departmentId).find((m) => m.id === municipalityId);
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

/** Empareja nombre devuelto por Mapbox con catálogo DANE. */
export function matchDepartmentByName(name: string | null | undefined): ColombiaDepartment | null {
  if (!name) return null;
  const n = normalize(name);
  const exact = departments.find((d) => normalize(d.name) === n);
  if (exact) return exact;
  // Bogotá suele venir como "Bogotá" o "Bogotá D.C."
  if (n.includes("bogota")) {
    return departments.find((d) => d.id === 11) ?? null;
  }
  return departments.find((d) => normalize(d.name).includes(n) || n.includes(normalize(d.name))) ?? null;
}

/** Restaura selects desde nombres guardados o ciudad legacy. */
export function resolveLocationFromAddress(parts: {
  department?: string | null;
  municipality?: string | null;
  city?: string | null;
}): ColombiaLocationValue {
  const dept =
    matchDepartmentByName(parts.department) ??
    (parts.city ? findDepartmentForMunicipalityName(parts.city) : null);
  const muniName = parts.municipality ?? parts.city;
  const muni = dept ? matchMunicipalityByName(dept.id, muniName) : null;
  return {
    departmentId: dept?.id ?? null,
    municipalityId: muni?.id ?? null,
  };
}

export interface ColombiaLocationValue {
  departmentId: number | null;
  municipalityId: number | null;
}

function findDepartmentForMunicipalityName(city: string): ColombiaDepartment | null {
  const n = normalize(city);
  for (const d of departments) {
    const hit = listMunicipalities(d.id).find((m) => normalize(m.name) === n);
    if (hit) return d;
  }
  return null;
}

export function matchMunicipalityByName(
  departmentId: number,
  name: string | null | undefined,
): ColombiaMunicipality | null {
  if (!name) return null;
  const n = normalize(name);
  const list = listMunicipalities(departmentId);
  const exact = list.find((m) => normalize(m.name) === n);
  if (exact) return exact;
  if (departmentId === 11 && n.includes("bogota")) {
    return list.find((m) => normalize(m.name).includes("bogota")) ?? null;
  }
  return (
    list.find(
      (m) => normalize(m.name).includes(n) || n.includes(normalize(m.name)),
    ) ?? null
  );
}
