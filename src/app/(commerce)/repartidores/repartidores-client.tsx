"use client";

import { useState, useTransition } from "react";
import { Bike, MapPin, Plus, Zap } from "lucide-react";
import { toast } from "sonner";

import { formatCOP } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  assignCourier,
  autoAssignNearest,
  createCourier,
  setCourierActive,
} from "@/modules/delivery/actions";
import type { CourierItem, DeliveryOrder } from "@/modules/delivery/queries";

type Result = { ok: boolean; message: string };

export function RepartidoresClient({
  couriers,
  orders,
}: {
  couriers: CourierItem[];
  orders: DeliveryOrder[];
}) {
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Record<string, string>>({});

  function run(fn: () => Promise<Result>, onOk?: () => void) {
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

  const pending = orders.filter((o) => o.status === "listo");
  const inTransit = orders.filter((o) => o.status === "en_camino");
  const activeCouriers = couriers.filter((c) => c.isActive);
  const courierName = (id: string | null) =>
    couriers.find((c) => c.id === id)?.fullName ?? "—";

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Repartidores */}
        <Card className="p-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
            <CardTitle className="text-base">Repartidores ({couriers.length})</CardTitle>
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="mr-1 h-4 w-4" /> Nuevo
            </Button>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ubic.</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {couriers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    Sin repartidores.
                  </TableCell>
                </TableRow>
              ) : (
                couriers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Bike className="h-4 w-4 text-muted-foreground" />
                        {c.fullName}
                        <Badge variant="outline" className="text-[10px]">
                          {c.relationship === "owned" ? "Propio" : "Compartido"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.vehicleType ?? "—"}
                    </TableCell>
                    <TableCell>
                      {c.lat != null ? (
                        <MapPin className="h-4 w-4 text-green-600" />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={c.isActive ? "outline" : "default"}
                        disabled={isPending}
                        onClick={() => run(() => setCourierActive(c.id, !c.isActive))}
                      >
                        {c.isActive ? "Activo" : "Inactivo"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* En camino */}
        <Card className="p-0">
          <CardHeader className="p-4">
            <CardTitle className="text-base">En camino ({inTransit.length})</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Repartidor</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inTransit.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    Sin entregas en curso.
                  </TableCell>
                </TableRow>
              ) : (
                inTransit.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-sm">#{o.id.slice(0, 6)}</TableCell>
                    <TableCell>{courierName(o.courierId)}</TableCell>
                    <TableCell>{formatCOP(o.total)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Pedidos listos para despachar */}
      <Card className="p-0">
        <CardHeader className="p-4">
          <CardTitle className="text-base">
            Listos para despachar ({pending.length})
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Asignar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pending.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No hay pedidos listos para despachar.
                </TableCell>
              </TableRow>
            ) : (
              pending.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-sm">#{o.id.slice(0, 6)}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {o.address?.line1 ?? "Retiro / sin dirección"}
                  </TableCell>
                  <TableCell>{formatCOP(o.total)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select
                        value={selected[o.id] ?? ""}
                        onValueChange={(v) =>
                          setSelected((s) => ({ ...s, [o.id]: v ?? "" }))
                        }
                      >
                        <SelectTrigger className="h-8 w-40">
                          <SelectValue placeholder="Repartidor" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeCouriers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending || !selected[o.id]}
                        onClick={() =>
                          run(() =>
                            assignCourier({
                              orderId: o.id,
                              courierId: selected[o.id],
                              method: "manual",
                            }),
                          )
                        }
                      >
                        Asignar
                      </Button>
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => run(() => autoAssignNearest(o.id))}
                      >
                        <Zap className="mr-1 h-3.5 w-3.5" /> Cercanía
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {creating && (
        <CourierDialog
          onClose={() => setCreating(false)}
          onCreate={(payload) =>
            run(() => createCourier(payload), () => setCreating(false))
          }
          isPending={isPending}
        />
      )}
    </div>
  );
}

function CourierDialog({
  onClose,
  onCreate,
  isPending,
}: {
  onClose: () => void;
  onCreate: (payload: {
    fullName: string;
    phone?: string;
    vehicleType?: string;
    relationship: string;
  }) => void;
  isPending: boolean;
}) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState("moto");
  const [relationship, setRelationship] = useState("owned");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo repartidor</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label>Nombre</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Teléfono</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Vehículo</Label>
              <Select value={vehicleType} onValueChange={(v) => setVehicleType(v ?? "moto")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moto">Moto</SelectItem>
                  <SelectItem value="bici">Bicicleta</SelectItem>
                  <SelectItem value="carro">Carro</SelectItem>
                  <SelectItem value="pie">A pie</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Relación</Label>
            <Select value={relationship} onValueChange={(v) => setRelationship(v ?? "owned")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owned">Propio</SelectItem>
                <SelectItem value="shared">Compartido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={isPending || fullName.length < 2}
            onClick={() =>
              onCreate({
                fullName,
                phone: phone || undefined,
                vehicleType,
                relationship,
              })
            }
          >
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
