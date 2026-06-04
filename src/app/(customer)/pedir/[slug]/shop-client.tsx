"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Star } from "lucide-react";
import { toast } from "sonner";

import { useCustomerCart } from "@/contexts/customer-cart-context";
import { ShopCartPanel } from "@/components/customer/shop-cart-panel";
import { RemoteImage } from "@/components/ui/remote-image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCOP } from "@/lib/format";
import { createCustomerOrder } from "@/modules/orders/customer-order";
import type { CustomerAddress } from "@/modules/customers/queries";
import type {
  Catalog,
  CatalogExtra,
  CatalogProduct,
} from "@/modules/pos/types";

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
  const searchParams = useSearchParams();
  const [activeCat, setActiveCat] = useState<string>(ALL);
  const [search, setSearch] = useState("");
  const [configProduct, setConfigProduct] = useState<CatalogProduct | null>(null);
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [addressId, setAddressId] = useState(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "",
  );
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const {
    setCommerce,
    cart,
    itemCount,
    totals,
    addLine,
    changeQty,
    removeLine,
    clearCart,
    hasItems,
    setCartOpen,
    openCart,
    setShopHost,
  } = useCustomerCart();

  useEffect(() => {
    setCommerce(commerceSlug, commerceName);
  }, [commerceSlug, commerceName, setCommerce]);

  useEffect(() => {
    if (searchParams.get("cart") === "open" && hasItems) {
      setCartOpen(true);
    }
  }, [searchParams, hasItems, setCartOpen]);

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

  function handleAddLine(
    product: CatalogProduct,
    variantId: string | null,
    extras: CatalogExtra[],
  ) {
    const wasEmpty = cart.length === 0;
    addLine(product, variantId, extras);
    toast.success("Agregado al carrito", {
      description: product.name,
      duration: 2000,
    });
    if (wasEmpty) {
      window.setTimeout(() => openCart(), 280);
    }
  }

  function onProductClick(product: CatalogProduct) {
    if (product.variants.length > 0 || product.extras.length > 0) {
      setConfigProduct(product);
    } else {
      handleAddLine(product, null, []);
    }
  }

  const checkout = useCallback(() => {
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
        clearCart();
        setCartOpen(false);
        router.push("/mis-pedidos");
      } else {
        toast.error(res.message);
      }
    });
  }, [
    cart,
    fulfillment,
    addressId,
    paymentMethod,
    notes,
    commerceSlug,
    clearCart,
    setCartOpen,
    router,
  ]);

  useEffect(() => {
    setShopHost({
      fulfillment,
      setFulfillment,
      addresses,
      addressId,
      setAddressId,
      paymentMethod,
      setPaymentMethod,
      notes,
      setNotes,
      onCheckout: checkout,
      isPending,
    });
    return () => setShopHost(null);
  }, [
    fulfillment,
    addresses,
    addressId,
    paymentMethod,
    notes,
    isPending,
    checkout,
    setShopHost,
  ]);

  const cartPanelProps = {
    cart,
    itemCount,
    totals,
    fulfillment,
    onFulfillmentChange: setFulfillment,
    addresses,
    addressId,
    onAddressIdChange: setAddressId,
    paymentMethod,
    onPaymentMethodChange: setPaymentMethod,
    notes,
    onNotesChange: setNotes,
    onChangeQty: changeQty,
    onRemoveLine: removeLine,
    onCheckout: checkout,
    isPending,
  };

  return (
    <div className="space-y-4 pb-4 sm:pb-0">
      <div>
        <h2 className="font-heading text-2xl font-bold">{commerceName}</h2>
        <p className="text-sm text-muted-foreground">
          Toca un producto para agregarlo al carrito.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4 pb-2 sm:pb-0">
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

          <div
            className={cn(
              "grid grid-cols-2 gap-3 sm:grid-cols-3",
              hasItems && "pb-24 sm:pb-0",
            )}
          >
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
                  className="flex flex-col overflow-hidden rounded-xl border bg-background text-left transition-all hover:border-brand-orange/80 hover:shadow-md active:scale-[0.98]"
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

        {hasItems && (
          <div className="hidden flex-col overflow-hidden rounded-xl border bg-background animate-in fade-in slide-in-from-right-4 duration-300 lg:sticky lg:top-20 lg:flex lg:max-h-[calc(100vh-6rem)]">
            <ShopCartPanel {...cartPanelProps} />
          </div>
        )}
      </div>

      <ProductConfigDialog
        product={configProduct}
        onClose={() => setConfigProduct(null)}
        onConfirm={(variantId, extras) => {
          if (configProduct) handleAddLine(configProduct, variantId, extras);
          setConfigProduct(null);
        }}
      />
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
            Agregar al carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
