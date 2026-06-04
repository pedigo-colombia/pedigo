"use client";

import { useState, useTransition } from "react";
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
                {a.city && (
                  <p className="text-sm text-muted-foreground">{a.city}</p>
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
    city?: string;
    lat?: number;
    lng?: number;
    isDefault?: boolean;
  }) => void;
  isPending: boolean;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [line1, setLine1] = useState(initial?.line1 ?? "");
  const [city, setCity] = useState(initial?.city ?? "Bogotá");
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Editar dirección" : "Nueva dirección"}</DialogTitle>
        </DialogHeader>
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
            <Label>Dirección</Label>
            <Input
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              placeholder="Carrera 15 # 45-20"
            />
          </div>
          <div className="grid gap-2">
            <Label>Ciudad</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
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
            disabled={isPending || line1.length < 3}
            onClick={() =>
              onSave({
                label: label || undefined,
                line1,
                city: city || undefined,
                isDefault,
              })
            }
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
