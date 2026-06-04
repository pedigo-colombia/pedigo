"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCOP, formatDateTime } from "@/lib/format";
import {
  addCashMovement,
  closeCashSession,
  openCashSession,
} from "@/modules/cash/actions";
import type { CashSessionView } from "@/modules/cash/queries";

export function CashClient({ session }: { session: CashSessionView | null }) {
  const [isPending, startTransition] = useTransition();
  const [opening, setOpening] = useState(0);
  const [counted, setCounted] = useState(0);
  const [movAmount, setMovAmount] = useState(0);
  const [movType, setMovType] = useState("in");
  const [movNotes, setMovNotes] = useState("");

  function open() {
    startTransition(async () => {
      const res = await openCashSession({ openingAmount: opening, registerName: "Caja 1" });
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    });
  }

  function close() {
    if (!session) return;
    startTransition(async () => {
      const res = await closeCashSession({
        sessionId: session.id,
        countedAmount: counted,
      });
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    });
  }

  function movement() {
    if (!session) return;
    startTransition(async () => {
      const res = await addCashMovement({
        sessionId: session.id,
        type: movType as "in" | "out" | "withdrawal",
        amount: movAmount,
        notes: movNotes || undefined,
      });
      if (res.ok) {
        toast.success(res.message);
        setMovAmount(0);
        setMovNotes("");
      } else {
        toast.error(res.message);
      }
    });
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-md p-6">
        <Card>
          <CardHeader>
            <CardTitle>Abrir caja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Monto de apertura</Label>
              <Input
                type="number"
                min={0}
                value={opening || ""}
                onChange={(e) => setOpening(Number(e.target.value) || 0)}
              />
            </div>
            <Button className="w-full" onClick={open} disabled={isPending}>
              {isPending ? "Abriendo…" : "Abrir caja"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-6 p-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{session.registerName} · sesión abierta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Line label="Apertura" value={formatCOP(session.openingAmount)} />
          <Line label="Ventas" value={formatCOP(session.salesTotal)} />
          <Line label="Ingresos" value={formatCOP(session.cashIn)} />
          <Line label="Egresos / retiros" value={`- ${formatCOP(session.cashOut)}`} />
          <div className="flex justify-between border-t pt-2 text-base font-bold">
            <span>Esperado en caja</span>
            <span className="text-orange-600">
              {formatCOP(session.expectedAmount)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Abierta {formatDateTime(session.openedAt)}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Movimiento de caja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              value={movType}
              onChange={(e) => setMovType(e.target.value)}
              className="h-9 w-full rounded-lg border bg-background px-2 text-sm"
            >
              <option value="in">Ingreso</option>
              <option value="out">Egreso</option>
              <option value="withdrawal">Retiro</option>
            </select>
            <Input
              type="number"
              min={0}
              placeholder="Monto"
              value={movAmount || ""}
              onChange={(e) => setMovAmount(Number(e.target.value) || 0)}
            />
            <Input
              placeholder="Nota (opcional)"
              value={movNotes}
              onChange={(e) => setMovNotes(e.target.value)}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={movement}
              disabled={isPending || movAmount <= 0}
            >
              Registrar movimiento
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Arqueo y cierre</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Efectivo contado</Label>
              <Input
                type="number"
                min={0}
                value={counted || ""}
                onChange={(e) => setCounted(Number(e.target.value) || 0)}
              />
              {counted > 0 && (
                <p className="text-xs text-muted-foreground">
                  Diferencia estimada:{" "}
                  {formatCOP(counted - session.expectedAmount)}
                </p>
              )}
            </div>
            <Button className="w-full" onClick={close} disabled={isPending}>
              Cerrar caja
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
