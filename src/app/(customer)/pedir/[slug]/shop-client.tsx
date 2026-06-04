"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Search, ShoppingCart, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { SegmentToggle } from "@/components/brand/segment-toggle";
import { RemoteImage } from "@/components/ui/remote-image";
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
import { createCustomerOrder } from "@/modules/orders/customer-order";
import type { CustomerAddress } from "@/modules/customers/queries";
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

export function ShopClient({
  commerceName,
  commerceSlug,
  catalog,
  addresses,
}: {
  commerceName: string;
  commerceSlug: string;
  catalog: Catalog;
  addresses: CustomerAddress[];
}) {
  const router = useRouter();
  const [activeCat, setActiveCat] = useState<string>(ALL);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [configProduct, setConfigProduct] = useState<CatalogProduct | null>(null);
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [addressId, setAddressId] = useState(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "",
  );
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
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
    return { subtotal, tax, total: subtotal + tax };
  }, [cart]);

  function checkout() {
    if (cart.length === 0) return;
    if (fulfillment === "delivery" && !addressId) {
      toast.error("Agrega una dirección en tu cuenta para delivery.");
      return;
    }
    startTransition(async () => {
      const res = await createCustomerOrder({
        commerceSlug,
        fulfillment,
        addressId: fulfillment === "delivery" ? addressId : undefined,
        paymentMethod: paymentMethod as "cash" | "transfer" | "online",
        notes: notes || undefined,
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
        router.push("/mis-pedidos");
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">{commerceName}</h2>
        <p className="text-sm text-muted-foreground">Arma tu pedido y confirma al final.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
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

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.length === 0 ? (
              <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
                Este comercio aún no tiene productos en el menú.
              </p>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onProductClick(p)}
                  className="flex flex-col overflow-hidden rounded-xl border bg-background text-left transition-all hover:border-orange-500"
                >
                  <RemoteImage
                    src={p.imageUrl ?? ""}
                    alt={p.name}
                    containerClassName="aspect-[4/3] w-full"
                    sizes="(max-width: 640px) 50vw, 180px"
                  />
                  <div className="flex flex-1 flex-col p-3">
                    <span className="text-sm font-medium leading-tight">{p.name}</span>
                    <span className="mt-2 font-semibold text-brand-orange">
                      {formatCOP(p.basePrice)}
                    </span>
                    {(p.variants.length > 0 || p.extras.length > 0) && (
                      <span className="mt-1 text-xs text-muted-foreground">
                        Personalizable
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-xl border bg-background lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)]">
          <div className="flex items-center gap-2 border-b p-4">
            <ShoppingCart className="h-4 w-4" />
            <span className="font-semibold">Tu pedido</span>
            <Badge variant="secondary" className="ml-auto">
              {cart.length}
            </Badge>
          </div>

          <div className="flex-1 space-y-2 overflow-auto p-4">
            {cart.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Toca un producto para agregarlo.
              </p>
            ) : (
              cart.map((l) => (
                <div key={l.key} className="rounded-lg border p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{l.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCOP(l.unitPrice)} c/u
                      </p>
                    </div>
                    <button type="button" onClick={() => removeLine(l.key)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon-sm"
                        variant="outline"
                        type="button"
                        onClick={() => changeQty(l.key, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">{l.quantity}</span>
                      <Button
                        size="icon-sm"
                        variant="outline"
                        type="button"
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
            <div>
              <Label className="text-xs">Entrega</Label>
              <div className="mt-1">
                <SegmentToggle
                  value={fulfillment}
                  options={[
                    { value: "pickup", label: "Recoger" },
                    { value: "delivery", label: "Domicilio" },
                  ]}
                  onChange={setFulfillment}
                />
              </div>
            </div>

            {fulfillment === "delivery" && (
              <div>
                <Label className="text-xs">Dirección</Label>
                {addresses.length === 0 ? (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    <a href="/direcciones" className="underline">
                      Agrega una dirección
                    </a>{" "}
                    para pedir a domicilio.
                  </p>
                ) : (
                  <select
                    value={addressId}
                    onChange={(e) => setAddressId(e.target.value)}
                    className="pedigo-select mt-1"
                  >
                    {addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {(a.label ? `${a.label} — ` : "") + a.line1}
                        {[
                          a.municipality ?? a.city,
                          a.department,
                        ]
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
                onChange={(e) => setPaymentMethod(e.target.value)}
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
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. sin cebolla"
                className="mt-1 h-9"
              />
            </div>

            <div className="space-y-1 rounded-lg bg-muted/40 p-3 text-sm">
              <Row label="Subtotal" value={formatCOP(totals.subtotal)} />
              <Row label="IVA" value={formatCOP(totals.tax)} />
              <div className="flex justify-between border-t pt-1 text-base font-bold">
                <span>Total</span>
                <span className="text-brand-orange">{formatCOP(totals.total)}</span>
              </div>
            </div>

            <Button
              type="button"
              variant="default"
              className="w-full"
              size="lg"
              disabled={cart.length === 0 || isPending}
              onClick={checkout}
            >
              {isPending ? "Enviando…" : `Confirmar ${formatCOP(totals.total)}`}
            </Button>
          </div>
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
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-brand-orange bg-brand-orange text-white"
          : "border-border bg-card text-foreground hover:bg-muted",
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
                      type="button"
                      onClick={() => setVariantId(v.id)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm",
                        variantId === v.id
                          ? "border-brand-orange bg-accent text-foreground"
                          : "hover:bg-muted",
                      )}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {product.extras.length > 0 && (
              <div className="space-y-2">
                <Label>Extras</Label>
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
            )}
          </div>
        )}
        <DialogFooter>
          <Button
            type="button"
            onClick={() => {
              const extras = product?.extras.filter((e) => extraIds.includes(e.id)) ?? [];
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
