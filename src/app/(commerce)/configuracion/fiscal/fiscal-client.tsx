"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateFiscalSettings } from "@/modules/billing/actions";
import type { FiscalSequence, FiscalSettings } from "@/modules/billing/queries";

const DOC_LABELS: Record<string, string> = {
  invoice: "Factura de venta",
  credit_note: "Nota crédito",
  debit_note: "Nota débito",
  support_document: "Documento soporte",
};

export function FiscalClient({
  settings,
  sequences,
}: {
  settings: FiscalSettings | null;
  sequences: FiscalSequence[];
}) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    legalName: settings?.legalName ?? "",
    nit: settings?.nit ?? "",
    regime: settings?.regime ?? "",
    address: settings?.address ?? "",
    dianEnvironment: settings?.dianEnvironment ?? "mock",
    invoicePrefix: settings?.invoicePrefix ?? "FE",
    creditNotePrefix: settings?.creditNotePrefix ?? "NC",
    debitNotePrefix: settings?.debitNotePrefix ?? "ND",
    supportDocPrefix: settings?.supportDocPrefix ?? "DS",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function save() {
    startTransition(async () => {
      const res = await updateFiscalSettings(form);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identidad fiscal</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label>Razón social</Label>
              <Input value={form.legalName} onChange={(e) => set("legalName", e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>NIT</Label>
                <Input value={form.nit} onChange={(e) => set("nit", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Régimen</Label>
                <Input
                  value={form.regime}
                  onChange={(e) => set("regime", e.target.value)}
                  placeholder="Responsable de IVA"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Dirección</Label>
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div className="grid gap-2 sm:w-1/2">
              <Label>Entorno DIAN</Label>
              <Select
                value={form.dianEnvironment}
                onValueChange={(v) => set("dianEnvironment", v ?? "mock")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mock">Simulado (mock)</SelectItem>
                  <SelectItem value="test">Pruebas (habilitación)</SelectItem>
                  <SelectItem value="prod">Producción</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prefijos de numeración</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="grid gap-2">
              <Label>Factura</Label>
              <Input value={form.invoicePrefix} onChange={(e) => set("invoicePrefix", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>N. crédito</Label>
              <Input value={form.creditNotePrefix} onChange={(e) => set("creditNotePrefix", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>N. débito</Label>
              <Input value={form.debitNotePrefix} onChange={(e) => set("debitNotePrefix", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Doc. soporte</Label>
              <Input value={form.supportDocPrefix} onChange={(e) => set("supportDocPrefix", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Button onClick={save} disabled={isPending}>
          {isPending ? "Guardando…" : "Guardar configuración"}
        </Button>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Consecutivos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sequences.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin secuencias configuradas.</p>
          ) : (
            sequences.map((s) => (
              <div key={s.docType} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {DOC_LABELS[s.docType] ?? s.docType}
                </span>
                <Badge variant="outline">
                  {s.prefix}
                  {s.currentNumber}
                </Badge>
              </div>
            ))
          )}
          <p className="pt-2 text-xs text-muted-foreground">
            El último número emitido por tipo de documento. La numeración es
            consecutiva y segura (lock transaccional).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
