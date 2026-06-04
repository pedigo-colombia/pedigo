"use client";

import { useCallback, useState, useTransition } from "react";
import { MapPin, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddressPickerMap } from "@/components/maps/address-picker-map";
import { ColombiaLocationFields } from "@/components/forms/colombia-location-fields";
import {
  getDepartmentById,
  getMunicipalityById,
  resolveLocationFromAddress,
  type ColombiaLocationValue,
} from "@/lib/colombia/divisions";
import {
  deleteAddress,
  saveAddress,
  setDefaultAddress,
} from "@/modules/customers/actions";
import type { CustomerAddress } from "@/modules/customers/queries";

export function DireccionesClient({ addresses }: { addresses: CustomerAddress[] }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerAddress | null>(null);

  function run(fn: () => Promise<{ ok: boolean; message: string }>, onOk?: () => void) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(res.message);
        onOk?.();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Mis direcciones</h2>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" /> Nueva
        </Button>
      </div>

      {addresses.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <MapPin className="mx-auto mb-2 h-8 w-8 opacity-50" />
          Guarda tus direcciones para pedidos a domicilio.
        </Card>
      ) : (
        <div className="grid gap-3">
          {addresses.map((a) => (
            <Card key={a.id} className="flex items-start justify-between gap-4 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{a.label ?? "Dirección"}</span>
                  {a.isDefault && <Badge variant="secondary">Predeterminada</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{a.line1}</p>
                {(a.municipality || a.city || a.department) && (
                  <p className="text-sm text-muted-foreground">
                    {[a.municipality ?? a.city, a.department].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                {!a.isDefault && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => run(() => setDefaultAddress(a.id))}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    setEditing(a);
                    setOpen(true);
                  }}
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => run(() => deleteAddress(a.id))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {open && (
        <AddressDialog
          initial={editing}
          onClose={() => setOpen(false)}
          isPending={isPending}
          onSave={(payload) =>
            run(
              () => saveAddress(payload, editing?.id),
              () => setOpen(false),
            )
          }
        />
      )}
    </div>
  );
}

function AddressDialog({
  initial,
  onClose,
  onSave,
  isPending,
}: {
  initial: CustomerAddress | null;
  onClose: () => void;
  onSave: (payload: {
    label?: string;
    line1: string;
    department?: string;
    municipality: string;
    lat?: number;
    lng?: number;
    isDefault?: boolean;
  }) => void;
  isPending: boolean;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [line1, setLine1] = useState(initial?.line1 ?? "");
  const [location, setLocation] = useState<ColombiaLocationValue>(() =>
    resolveLocationFromAddress({
      department: initial?.department,
      municipality: initial?.municipality,
      city: initial?.city,
    }),
  );
  const [lat, setLat] = useState<number | null>(initial?.lat ?? null);
  const [lng, setLng] = useState<number | null>(initial?.lng ?? null);
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);

  const hasCoords = lat != null && lng != null;
  const hasDivision =
    location.departmentId != null && location.municipalityId != null;
  const canSave = line1.trim().length >= 3 && hasCoords && hasDivision;

  const handleMapChange = useCallback(
    (v: {
      lat: number;
      lng: number;
      line1: string;
      department: string | null;
      municipality: string | null;
      city: string | null;
    }) => {
      setLat(v.lat);
      setLng(v.lng);
      if (v.line1) setLine1((prev) => (prev === v.line1 ? prev : v.line1));
      const next = resolveLocationFromAddress({
        department: v.department,
        municipality: v.municipality ?? v.city,
        city: v.municipality ?? v.city,
      });
      setLocation((prev) =>
        prev.departmentId === next.departmentId &&
        prev.municipalityId === next.municipalityId
          ? prev
          : next,
      );
    },
    [],
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar dirección" : "Nueva dirección"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <AddressPickerMap
            key={initial?.id ?? "new"}
            initialLat={initial?.lat}
            initialLng={initial?.lng}
            autoLocateOnMount={!initial}
            onChange={handleMapChange}
          />

          <ColombiaLocationFields value={location} onChange={setLocation} />

          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label>Etiqueta</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Casa, Oficina…"
              />
            </div>
            <div className="grid gap-2">
              <Label>Dirección detectada</Label>
              <Input
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                placeholder="Carrera, calle, número…"
              />
            </div>
          </div>

          {!hasCoords && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Marca el pin en el mapa o usa &quot;Usar mi ubicación&quot; para continuar.
            </p>
          )}
          {hasCoords && !hasDivision && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Selecciona departamento y municipio (el mapa intenta autocompletarlos).
            </p>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            Usar como predeterminada
          </label>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="default"
            size="lg"
            disabled={isPending || !canSave}
            onClick={() => {
              const dept =
                location.departmentId != null
                  ? getDepartmentById(location.departmentId)
                  : undefined;
              const muni =
                location.departmentId != null && location.municipalityId != null
                  ? getMunicipalityById(location.departmentId, location.municipalityId)
                  : undefined;
              if (!muni) return;
              onSave({
                label: label || undefined,
                line1: line1.trim(),
                department: dept?.name,
                municipality: muni.name,
                lat: lat ?? undefined,
                lng: lng ?? undefined,
                isDefault,
              });
            }}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
