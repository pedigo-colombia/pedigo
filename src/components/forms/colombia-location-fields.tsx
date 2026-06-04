"use client";

import { useMemo } from "react";

import { Label } from "@/components/ui/label";
import {
  listDepartments,
  listMunicipalities,
  getDepartmentById,
  getMunicipalityById,
} from "@/lib/colombia/divisions";

import type { ColombiaLocationValue } from "@/lib/colombia/divisions";

export function ColombiaLocationFields({
  value,
  onChange,
  disabled,
}: {
  value: ColombiaLocationValue;
  onChange: (next: ColombiaLocationValue) => void;
  disabled?: boolean;
}) {
  const departments = useMemo(() => listDepartments(), []);
  const municipalities = useMemo(
    () => (value.departmentId != null ? listMunicipalities(value.departmentId) : []),
    [value.departmentId],
  );

  const deptName = value.departmentId != null ? getDepartmentById(value.departmentId)?.name : "";
  const muniName =
    value.departmentId != null && value.municipalityId != null
      ? getMunicipalityById(value.departmentId, value.municipalityId)?.name
      : "";

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label>Departamento</Label>
        <select
          disabled={disabled}
          value={value.departmentId ?? ""}
          onChange={(e) => {
            const id = e.target.value ? Number(e.target.value) : null;
            onChange({ departmentId: id, municipalityId: null });
          }}
          className="h-9 w-full rounded-lg border bg-background px-2 text-sm"
        >
          <option value="">Selecciona departamento</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label>Municipio</Label>
        <select
          disabled={disabled || value.departmentId == null}
          value={value.municipalityId ?? ""}
          onChange={(e) => {
            const id = e.target.value ? Number(e.target.value) : null;
            onChange({ departmentId: value.departmentId, municipalityId: id });
          }}
          className="h-9 w-full rounded-lg border bg-background px-2 text-sm"
        >
          <option value="">
            {value.departmentId == null ? "Primero el departamento" : "Selecciona municipio"}
          </option>
          {municipalities.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      {deptName && muniName && (
        <p className="text-xs text-muted-foreground sm:col-span-2">
          {muniName}, {deptName}
        </p>
      )}
    </div>
  );
}
