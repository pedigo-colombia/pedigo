"use client";

import { useState, useTransition } from "react";
import { FileText, Receipt } from "lucide-react";
import { toast } from "sonner";

import { formatCOP } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
  fetchInvoiceDetail,
  issueInvoiceNote,
  issueSupport,
} from "@/modules/billing/actions";
import type { InvoiceDetail, InvoiceListItem } from "@/modules/billing/queries";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "success" | "destructive"
> = {
  issued: "success",
  accepted: "success",
  draft: "secondary",
  rejected: "destructive",
  void: "outline",
};

export function FacturacionClient({ invoices }: { invoices: InvoiceListItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);

  function openDetail(id: string) {
    setLoadingId(id);
    startTransition(async () => {
      const d = await fetchInvoiceDetail(id);
      setLoadingId(null);
      if (d) setDetail(d);
      else toast.error("No se pudo cargar la factura.");
    });
  }

  function refreshDetail(id: string) {
    startTransition(async () => {
      const d = await fetchInvoiceDetail(id);
      if (d) setDetail(d);
    });
  }

  return (
    <>
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setSupportOpen(true)}>
          <FileText className="mr-1 h-4 w-4" /> Documento soporte
        </Button>
      </div>

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>CUFE</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Aún no hay facturas. Se generan automáticamente al vender en el POS.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.fullNumber}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {i.issuedAt
                      ? new Date(i.issuedAt).toLocaleDateString("es-CO")
                      : "—"}
                  </TableCell>
                  <TableCell>{formatCOP(i.total)}</TableCell>
                  <TableCell className="max-w-32 truncate font-mono text-xs text-muted-foreground">
                    {i.cufe ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[i.status] ?? "secondary"}>
                      {i.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isPending && loadingId === i.id}
                      onClick={() => openDetail(i.id)}
                    >
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {detail && (
        <InvoiceDetailDialog
          detail={detail}
          onClose={() => setDetail(null)}
          onChanged={() => refreshDetail(detail.id)}
          isPending={isPending}
        />
      )}

      {supportOpen && (
        <SupportDialog onClose={() => setSupportOpen(false)} isPending={isPending} startTransition={startTransition} />
      )}
    </>
  );
}

function InvoiceDetailDialog({
  detail,
  onClose,
  onChanged,
  isPending,
}: {
  detail: InvoiceDetail;
  onClose: () => void;
  onChanged: () => void;
  isPending: boolean;
}) {
  const [, startTransition] = useTransition();
  const [kind, setKind] = useState("credit_note");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState(0);

  const customerName =
    (detail.customerSnapshot?.name as string | undefined) ?? "Consumidor final";

  function emitNote() {
    startTransition(async () => {
      const res = await issueInvoiceNote({
        invoiceId: detail.id,
        kind,
        reason,
        total: amount,
      });
      if (res.ok) {
        toast.success(res.message);
        setReason("");
        setAmount(0);
        onChanged();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" /> Factura {detail.fullNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Cliente</span>
            <span className="text-right">{customerName}</span>
            <span className="text-muted-foreground">CUFE</span>
            <span className="break-all text-right font-mono text-xs">{detail.cufe ?? "—"}</span>
            <span className="text-muted-foreground">Estado</span>
            <span className="text-right">{detail.status}</span>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold">Ítems (foto fiscal)</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Cant.</TableHead>
                  <TableHead>P. unit.</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.items.map((it, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{it.description}</TableCell>
                    <TableCell>{it.qty}</TableCell>
                    <TableCell>{formatCOP(it.unitPrice)}</TableCell>
                    <TableCell>{formatCOP(it.lineTotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-2 space-y-1 text-right text-sm">
              <div>Subtotal: {formatCOP(detail.subtotal)}</div>
              <div>IVA: {formatCOP(detail.taxTotal)}</div>
              <div className="font-bold">Total: {formatCOP(detail.total)}</div>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold">Trazabilidad DIAN</h4>
            <ol className="space-y-1 text-sm">
              {detail.logs.length === 0 ? (
                <li className="text-muted-foreground">Sin eventos.</li>
              ) : (
                detail.logs.map((l, idx) => (
                  <li key={idx} className="flex items-center justify-between">
                    <span>
                      <Badge variant="outline" className="mr-2">
                        {l.event}
                      </Badge>
                      {l.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(l.createdAt).toLocaleString("es-CO")}
                    </span>
                  </li>
                ))
              )}
            </ol>
          </div>

          {detail.notes.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold">Notas asociadas</h4>
              <ul className="space-y-1 text-sm">
                {detail.notes.map((n, idx) => (
                  <li key={idx} className="flex items-center justify-between">
                    <span>
                      {n.kind} {n.fullNumber} — {n.reason ?? ""}
                    </span>
                    <span>{formatCOP(n.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-lg border p-3">
            <h4 className="mb-2 text-sm font-semibold">Emitir nota</h4>
            <div className="grid gap-2 sm:grid-cols-3">
              <Select value={kind} onValueChange={(v) => setKind(v ?? "credit_note")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_note">Nota crédito</SelectItem>
                  <SelectItem value="debit_note">Nota débito</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                placeholder="Monto"
              />
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motivo"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button disabled={isPending || amount <= 0 || reason.length < 3} onClick={emitNote}>
            Emitir nota
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SupportDialog({
  onClose,
  isPending,
  startTransition,
}: {
  onClose: () => void;
  isPending: boolean;
  startTransition: (cb: () => void) => void;
}) {
  const [supplierName, setSupplierName] = useState("");
  const [supplierDoc, setSupplierDoc] = useState("");
  const [total, setTotal] = useState(0);

  function submit() {
    startTransition(async () => {
      const res = await issueSupport({ supplierName, supplierDoc: supplierDoc || undefined, total });
      if (res.ok) {
        toast.success(res.message);
        onClose();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Documento soporte</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label>Proveedor (no obligado a facturar)</Label>
            <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Documento</Label>
              <Input value={supplierDoc} onChange={(e) => setSupplierDoc(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Total</Label>
              <Input
                type="number"
                value={total || ""}
                onChange={(e) => setTotal(Number(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={isPending || supplierName.length < 2 || total <= 0} onClick={submit}>
            Emitir soporte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
