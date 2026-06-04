"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

import { SegmentToggle } from "@/components/brand/segment-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCOP } from "@/lib/format";
import type { CartLine } from "@/lib/customer-cart/types";
import type { CustomerAddress } from "@/modules/customers/queries";

export function ShopCartPanel({
  cart,
  itemCount,
  totals,
  fulfillment,
  onFulfillmentChange,
  addresses,
  addressId,
  onAddressIdChange,
  paymentMethod,
  onPaymentMethodChange,
  notes,
  onNotesChange,
  onChangeQty,
  onRemoveLine,
  onCheckout,
  isPending,
  compactHeader,
}: {
  cart: CartLine[];
  itemCount: number;
  totals: { subtotal: number; tax: number; total: number };
  fulfillment: "pickup" | "delivery";
  onFulfillmentChange: (v: "pickup" | "delivery") => void;
  addresses: CustomerAddress[];
  addressId: string;
  onAddressIdChange: (id: string) => void;
  paymentMethod: string;
  onPaymentMethodChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  onChangeQty: (key: string, delta: number) => void;
  onRemoveLine: (key: string) => void;
  onCheckout: () => void;
  isPending: boolean;
  compactHeader?: boolean;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className={
          compactHeader
            ? "flex shrink-0 items-center gap-2 border-b px-4 py-3"
            : "flex shrink-0 items-center gap-2 border-b p-4"
        }
      >
        <ShoppingCart className="h-4 w-4 text-brand-orange" />
        <span className="font-semibold">Tu pedido</span>
        {itemCount > 0 && (
          <Badge className="ml-auto bg-brand-orange text-white">{itemCount}</Badge>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-4">
        {cart.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Toca un producto del menú para agregarlo.
          </p>
        ) : (
          cart.map((l) => (
            <div key={l.key} className="rounded-lg border border-border/80 bg-background p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{l.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCOP(l.unitPrice)} c/u
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Quitar"
                  onClick={() => onRemoveLine(l.key)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="icon-sm"
                    variant="outline"
                    type="button"
                    onClick={() => onChangeQty(l.key, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm tabular-nums">
                    {l.quantity}
                  </span>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    type="button"
                    onClick={() => onChangeQty(l.key, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="text-sm font-semibold text-brand-orange">
                  {formatCOP(l.unitPrice * l.quantity)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {cart.length > 0 && (
        <div className="shrink-0 space-y-3 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div>
            <Label className="text-xs">Entrega</Label>
            <div className="mt-1">
              <SegmentToggle
                value={fulfillment}
                options={[
                  { value: "pickup", label: "Recoger" },
                  { value: "delivery", label: "Domicilio" },
                ]}
                onChange={onFulfillmentChange}
              />
            </div>
          </div>

          {fulfillment === "delivery" && (
            <div>
              <Label className="text-xs">Dirección</Label>
              {addresses.length === 0 ? (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  <Link href="/direcciones" className="font-semibold underline">
                    Agrega una dirección
                  </Link>{" "}
                  para pedir a domicilio.
                </p>
              ) : (
                <select
                  value={addressId}
                  onChange={(e) => onAddressIdChange(e.target.value)}
                  className="pedigo-select mt-1"
                >
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {(a.label ? `${a.label} — ` : "") + a.line1}
                      {[a.municipality ?? a.city, a.department]
                        .filter(Boolean)
                        .length > 0
                        ? `, ${[a.municipality ?? a.city, a.department].filter(Boolean).join(", ")}`
                        : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <Label className="text-xs">Pago</Label>
            <select
              value={paymentMethod}
              onChange={(e) => onPaymentMethodChange(e.target.value)}
              className="pedigo-select mt-1"
            >
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
              <option value="online">Pago online</option>
            </select>
          </div>

          <div>
            <Label className="text-xs">Notas (opcional)</Label>
            <Input
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Ej. sin cebolla"
              className="mt-1 h-9"
            />
          </div>

          <div className="space-y-1 rounded-lg bg-muted/40 p-3 text-sm">
            <Row label="Subtotal" value={formatCOP(totals.subtotal)} />
            <Row label="IVA" value={formatCOP(totals.tax)} />
            <div className="flex justify-between border-t border-border/60 pt-1 text-base font-bold">
              <span>Total</span>
              <span className="text-brand-orange">{formatCOP(totals.total)}</span>
            </div>
          </div>

          <Button
            type="button"
            variant="default"
            className="w-full"
            size="lg"
            disabled={isPending}
            onClick={onCheckout}
          >
            {isPending ? "Enviando…" : `Confirmar ${formatCOP(totals.total)}`}
          </Button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
