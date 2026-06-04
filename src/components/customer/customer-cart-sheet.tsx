"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";

import { useCustomerCart } from "@/contexts/customer-cart-context";
import { ShopCartPanel } from "@/components/customer/shop-cart-panel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { buttonVariants } from "@/components/ui/button";

/** Panel global del carrito (sheet inferior en móvil). */
export function CustomerCartSheet() {
  const pathname = usePathname();
  const {
    cart,
    itemCount,
    totals,
    cartOpen,
    setCartOpen,
    changeQty,
    removeLine,
    commerceName,
    commerceSlug,
    hasItems,
    shopHost,
  } = useCustomerCart();

  const onShop =
    commerceSlug != null && pathname === `/pedir/${commerceSlug}`;
  const canCheckout = hasItems && shopHost != null && onShop;

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent
        side="bottom"
        className="flex max-h-[min(92dvh,720px)] flex-col rounded-t-3xl p-0"
        showCloseButton
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Tu pedido</SheetTitle>
        </SheetHeader>
        {canCheckout && shopHost ? (
          <ShopCartPanel
            cart={cart}
            itemCount={itemCount}
            totals={totals}
            fulfillment={shopHost.fulfillment}
            onFulfillmentChange={shopHost.setFulfillment}
            addresses={shopHost.addresses}
            addressId={shopHost.addressId}
            onAddressIdChange={shopHost.setAddressId}
            paymentMethod={shopHost.paymentMethod}
            onPaymentMethodChange={shopHost.setPaymentMethod}
            notes={shopHost.notes}
            onNotesChange={shopHost.setNotes}
            onChangeQty={changeQty}
            onRemoveLine={removeLine}
            onCheckout={shopHost.onCheckout}
            isPending={shopHost.isPending}
            compactHeader
          />
        ) : hasItems ? (
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <p className="font-heading text-lg font-bold">
              Pedido en {commerceName ?? "restaurante"}
            </p>
            <p className="text-sm text-muted-foreground">
              {itemCount} producto{itemCount !== 1 ? "s" : ""} · continúa en el menú para
              confirmar.
            </p>
            <Link
              href={`/pedir/${commerceSlug}?cart=open`}
              className={buttonVariants({ size: "lg" })}
              onClick={() => setCartOpen(false)}
            >
              Ir al menú
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
            <div>
              <p className="font-heading text-lg font-bold">Tu carrito está vacío</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Elige un restaurante y agrega productos para verlos aquí.
              </p>
            </div>
            <Link
              href="/pedir"
              className={buttonVariants({ size: "lg" })}
              onClick={() => setCartOpen(false)}
            >
              Ver restaurantes
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
