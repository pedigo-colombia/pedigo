"use client";

import { usePathname } from "next/navigation";
import { ChevronUp, ShoppingCart } from "lucide-react";

import { useCustomerCart } from "@/contexts/customer-cart-context";
import { formatCOP } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Barra flotante sobre el nav inferior cuando hay productos en el menú activo. */
export function CustomerCartPeekBar() {
  const pathname = usePathname();
  const { hasItems, itemCount, totals, commerceSlug, openCart } = useCustomerCart();

  const onShop =
    commerceSlug != null && pathname === `/pedir/${commerceSlug}`;

  if (!hasItems || !onShop) return null;

  return (
    <button
      type="button"
      onClick={openCart}
      className={cn(
        "fixed inset-x-3 bottom-[4.25rem] z-40 sm:hidden",
        "flex items-center gap-3 rounded-2xl border border-brand-orange/40 bg-card px-4 py-3 shadow-lg",
        "animate-in slide-in-from-bottom-4 fade-in duration-300",
        "active:scale-[0.98] transition-transform",
      )}
      aria-label="Ver carrito"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-orange text-white">
        <ShoppingCart className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-sm font-bold">
          {itemCount} producto{itemCount !== 1 ? "s" : ""} en tu pedido
        </span>
        <span className="text-xs text-muted-foreground">Toca para revisar y confirmar</span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block font-bold text-brand-orange">{formatCOP(totals.total)}</span>
        <ChevronUp className="ml-auto h-4 w-4 text-muted-foreground" />
      </span>
    </button>
  );
}
