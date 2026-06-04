"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Minus, Plus, Search, ShoppingCart, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatCOP } from "@/lib/format";
import { createSale } from "@/modules/pos/actions";
import type {
  Catalog,
  CatalogExtra,
  CatalogProduct,
} from "@/modules/pos/types";

interface CartLine {
  key: string;
  productId: string;
  label: string;
  variantId: string | null;
  unitPrice: number;
  taxRate: number;
  quantity: number;
  extras: CatalogExtra[];
}

const FAVORITES = "__fav__";
const ALL = "__all__";

export function PosClient({
  catalog,
  hasOpenCash,
}: {
  catalog: Catalog;
  hasOpenCash: boolean;
}) {
  const [activeCat, setActiveCat] = useState<string>(ALL);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [configProduct, setConfigProduct] = useState<CatalogProduct | null>(null);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [channel, setChannel] = useState("pos");
  const [customerName, setCustomerName] = useState("");
  const [generateInvoice, setGenerateInvoice] = useState(true);
  const [isPending, startTransition] = useTransition();
  const lineSeq = useRef(0);

  const filtered = useMemo(() => {
    return catalog.products.filter((p) => {
      if (activeCat === FAVORITES && !p.isFavorite) return false;
      if (activeCat !== ALL && activeCat !== FAVORITES && p.categoryId !== activeCat)
        return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [catalog.products, activeCat, search]);

  function addLine(
    product: CatalogProduct,
    variantId: string | null,
    extras: CatalogExtra[],
  ) {
    const variant = product.variants.find((v) => v.id === variantId) ?? null;
    const unitPrice =
      product.basePrice +
      (variant?.priceDelta ?? 0) +
      extras.reduce((acc, e) => acc + e.price, 0);
    const label = variant ? `${product.name} (${variant.name})` : product.name;
    const key = `${product.id}-${variantId ?? "base"}-${extras
      .map((e) => e.id)
      .join("_")}-${(lineSeq.current += 1)}`;

    setCart((prev) => [
      ...prev,
      {
        key,
        productId: product.id,
        label,
        variantId,
        unitPrice,
        taxRate: product.taxRate,
        quantity: 1,
        extras,
      },
    ]);
  }

  function onProductClick(product: CatalogProduct) {
    if (product.variants.length > 0 || product.extras.length > 0) {
      setConfigProduct(product);
    } else {
      addLine(product, null, []);
    }
  }

  function changeQty(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.key === key ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l,
        )
        .filter((l) => l.quantity > 0),
    );
  }

  function removeLine(key: string) {
    setCart((prev) => prev.filter((l) => l.key !== key));
  }

  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0);
    const tax = cart.reduce(
      (acc, l) => acc + l.unitPrice * l.quantity * l.taxRate,
      0,
    );
    const d = Math.min(discount, subtotal);
    return { subtotal, tax, discount: d, total: subtotal - d + tax };
  }, [cart, discount]);

  function checkout() {
    if (cart.length === 0) return;
    startTransition(async () => {
      const res = await createSale({
        channel: channel as "pos" | "app" | "whatsapp",
        paymentMethod: paymentMethod as "cash" | "transfer" | "datafono" | "online",
        discountTotal: discount,
        customerName: customerName || undefined,
        generateInvoice,
        lines: cart.map((l) => ({
          productId: l.productId,
          variantId: l.variantId,
          quantity: l.quantity,
          extraIds: l.extras.map((e) => e.id),
        })),
      });
      if (res.ok) {
        toast.success(res.message);
        setCart([]);
        setDiscount(0);
        setCustomerName("");
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="grid h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-[1fr_380px]">
      {/* Catálogo */}
      <div className="flex flex-col overflow-hidden border-r">
        <div className="space-y-3 border-b p-4">
          {!hasOpenCash && (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              No hay caja abierta. Las ventas en efectivo no sumarán a la caja.
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <CatChip active={activeCat === ALL} onClick={() => setActiveCat(ALL)}>
              Todos
            </CatChip>
            <CatChip
              active={activeCat === FAVORITES}
              onClick={() => setActiveCat(FAVORITES)}
            >
              <Star className="mr-1 h-3 w-3" /> Favoritos
            </CatChip>
            {catalog.categories.map((c) => (
              <CatChip
                key={c.id}
                active={activeCat === c.id}
                onClick={() => setActiveCat(c.id)}
              >
                {c.name}
              </CatChip>
            ))}
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 content-start gap-3 overflow-auto p-4 sm:grid-cols-3 xl:grid-cols-4">
          {filtered.length === 0 ? (
            <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
              No hay productos. Crea productos en Inventario o ejecuta el seed.
            </p>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => onProductClick(p)}
                className="flex flex-col rounded-xl border bg-background p-3 text-left transition-all hover:border-orange-500 hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium leading-tight">
                    {p.name}
                  </span>
                  {p.isFavorite && (
                    <Star className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
                  )}
                </div>
                <span className="mt-2 text-base font-semibold text-orange-600">
                  {formatCOP(p.basePrice)}
                </span>
                {(p.variants.length > 0 || p.extras.length > 0) && (
                  <span className="mt-1 text-xs text-muted-foreground">
                    Personalizable
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Carrito */}
      <div className="flex flex-col overflow-hidden bg-background">
        <div className="flex items-center gap-2 border-b p-4">
          <ShoppingCart className="h-4 w-4" />
          <span className="font-semibold">Venta actual</span>
          <Badge variant="secondary" className="ml-auto">
            {cart.length} líneas
          </Badge>
        </div>

        <div className="flex-1 space-y-2 overflow-auto p-4">
          {cart.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Toca un producto para agregarlo.
            </p>
          ) : (
            cart.map((l) => (
              <div key={l.key} className="rounded-lg border p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{l.label}</p>
                    {l.extras.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        + {l.extras.map((e) => e.name).join(", ")}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatCOP(l.unitPrice)} c/u
                    </p>
                  </div>
                  <button onClick={() => removeLine(l.key)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon-sm"
                      variant="outline"
                      onClick={() => changeQty(l.key, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm">{l.quantity}</span>
                    <Button
                      size="icon-sm"
                      variant="outline"
                      onClick={() => changeQty(l.key, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-sm font-semibold">
                    {formatCOP(l.unitPrice * l.quantity)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 border-t p-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Canal</Label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="mt-1 h-8 w-full rounded-lg border bg-background px-2 text-sm"
              >
                <option value="pos">Presencial</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="app">App</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Pago</Label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-1 h-8 w-full rounded-lg border bg-background px-2 text-sm"
              >
                <option value="cash">Efectivo</option>
                <option value="datafono">Datáfono</option>
                <option value="transfer">Transferencia</option>
                <option value="online">Pago online</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Descuento</Label>
              <Input
                type="number"
                min={0}
                value={discount || ""}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="mt-1 h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Cliente (opcional)</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Consumidor final"
                className="mt-1 h-8"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={generateInvoice}
              onChange={(e) => setGenerateInvoice(e.target.checked)}
            />
            Generar factura
          </label>

          <div className="space-y-1 rounded-lg bg-muted/40 p-3 text-sm">
            <Row label="Subtotal" value={formatCOP(totals.subtotal)} />
            <Row label="Descuento" value={`- ${formatCOP(totals.discount)}`} />
            <Row label="IVA" value={formatCOP(totals.tax)} />
            <div className="flex justify-between border-t pt-1 text-base font-bold">
              <span>Total</span>
              <span className="text-orange-600">{formatCOP(totals.total)}</span>
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={cart.length === 0 || isPending}
            onClick={checkout}
          >
            {isPending ? "Procesando…" : `Cobrar ${formatCOP(totals.total)}`}
          </Button>
        </div>
      </div>

      <ProductConfigDialog
        product={configProduct}
        onClose={() => setConfigProduct(null)}
        onConfirm={(variantId, extras) => {
          if (configProduct) addLine(configProduct, variantId, extras);
          setConfigProduct(null);
        }}
      />
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

function CatChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-orange-600 bg-orange-600 text-white"
          : "hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function ProductConfigDialog({
  product,
  onClose,
  onConfirm,
}: {
  product: CatalogProduct | null;
  onClose: () => void;
  onConfirm: (variantId: string | null, extras: CatalogExtra[]) => void;
}) {
  const [variantId, setVariantId] = useState<string | null>(null);
  const [extraIds, setExtraIds] = useState<string[]>([]);

  // Reinicia al abrir un producto distinto.
  const open = product !== null;
  const key = product?.id ?? "none";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          setVariantId(null);
          setExtraIds([]);
        }
      }}
    >
      <DialogContent key={key}>
        <DialogHeader>
          <DialogTitle>{product?.name}</DialogTitle>
        </DialogHeader>
        {product && (
          <div className="space-y-4">
            {product.variants.length > 0 && (
              <div className="space-y-2">
                <Label>Variante</Label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVariantId(v.id)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm",
                        variantId === v.id
                          ? "border-orange-600 bg-orange-50"
                          : "hover:bg-muted",
                      )}
                    >
                      {v.name}{" "}
                      {v.priceDelta !== 0 && (
                        <span className="text-muted-foreground">
                          ({v.priceDelta > 0 ? "+" : ""}
                          {formatCOP(v.priceDelta)})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {product.extras.length > 0 && (
              <div className="space-y-2">
                <Label>Extras</Label>
                <div className="space-y-1">
                  {product.extras.map((e) => (
                    <label key={e.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={extraIds.includes(e.id)}
                        onChange={(ev) =>
                          setExtraIds((prev) =>
                            ev.target.checked
                              ? [...prev, e.id]
                              : prev.filter((id) => id !== e.id),
                          )
                        }
                      />
                      {e.name} — {formatCOP(e.price)}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button
            onClick={() => {
              const extras =
                product?.extras.filter((e) => extraIds.includes(e.id)) ?? [];
              onConfirm(variantId, extras);
              setVariantId(null);
              setExtraIds([]);
            }}
          >
            Agregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
