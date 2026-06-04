"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";

import { useCustomerCartOptional } from "@/contexts/customer-cart-context";
import { cn } from "@/lib/utils";

const links = [
  { href: "/cuenta", label: "Inicio", match: (p: string) => p === "/cuenta" },
  {
    href: "/pedir",
    label: "Pedir",
    match: (p: string) => p === "/pedir" || p.startsWith("/pedir/"),
  },
  { href: "/mis-pedidos", label: "Mis pedidos", match: (p: string) => p === "/mis-pedidos" },
  { href: "/direcciones", label: "Direcciones", match: (p: string) => p === "/direcciones" },
] as const;

export function CustomerNavLinks({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const cartCtx = useCustomerCartOptional();
  const itemCount = cartCtx?.itemCount ?? 0;

  function onCartClick() {
    if (!cartCtx) return;
    if (cartCtx.hasItems && cartCtx.commerceSlug) {
      if (pathname !== `/pedir/${cartCtx.commerceSlug}`) {
        router.push(`/pedir/${cartCtx.commerceSlug}?cart=open`);
      } else {
        cartCtx.openCart();
      }
    } else {
      cartCtx.setCartOpen(true);
    }
  }

  return (
    <nav className={cn("hidden items-center gap-1 sm:flex", className)}>
      {links.map((l) => {
        const active = l.match(pathname);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
              active
                ? "bg-accent text-brand-orange"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {l.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onCartClick}
        className={cn(
          "relative inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
          "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        <ShoppingCart className="h-4 w-4" />
        Carrito
        {itemCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold text-white">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </button>
    </nav>
  );
}
