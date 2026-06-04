"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, MapPin, ShoppingBag, ShoppingCart, Store } from "lucide-react";

import { useCustomerCartOptional } from "@/contexts/customer-cart-context";
import { cn } from "@/lib/utils";

const linkTabs = [
  { href: "/cuenta", label: "Inicio", icon: Home, match: (p: string) => p === "/cuenta" },
  {
    href: "/pedir",
    label: "Pedir",
    icon: Store,
    match: (p: string) => p === "/pedir" || p.startsWith("/pedir/"),
  },
  {
    href: "/mis-pedidos",
    label: "Pedidos",
    icon: ShoppingBag,
    match: (p: string) => p === "/mis-pedidos",
  },
  {
    href: "/direcciones",
    label: "Direcciones",
    icon: MapPin,
    match: (p: string) => p === "/direcciones",
  },
] as const;

function CartTabButton({
  active,
  itemCount,
  badgePulse,
  onPress,
}: {
  active: boolean;
  itemCount: number;
  badgePulse: boolean;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={cn(
        "relative flex w-full flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors",
        active ? "text-brand-orange" : "text-muted-foreground",
      )}
      aria-label={
        itemCount > 0
          ? `Carrito, ${itemCount} productos`
          : "Carrito vacío"
      }
    >
      <span className="relative">
        <ShoppingCart
          className={cn(
            "h-5 w-5",
            active && "stroke-[2.5]",
            badgePulse && "animate-bounce",
          )}
        />
        {itemCount > 0 && (
          <span
            className={cn(
              "absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-orange px-1 text-[9px] font-bold text-white",
              badgePulse && "animate-pulse ring-2 ring-brand-orange/40",
            )}
          >
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </span>
      Carrito
    </button>
  );
}

export function CustomerMobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const cartCtx = useCustomerCartOptional();

  const itemCount = cartCtx?.itemCount ?? 0;
  const badgePulse = cartCtx?.badgePulse ?? false;
  const commerceSlug = cartCtx?.commerceSlug;
  const hasItems = cartCtx?.hasItems ?? false;

  const cartActive =
    commerceSlug != null && pathname === `/pedir/${commerceSlug}`;

  function onCartPress() {
    if (!cartCtx) return;
    if (hasItems && commerceSlug) {
      if (pathname !== `/pedir/${commerceSlug}`) {
        router.push(`/pedir/${commerceSlug}?cart=open`);
        return;
      }
      cartCtx.openCart();
    } else {
      cartCtx.setCartOpen(true);
    }
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur sm:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 py-1.5">
        {linkTabs.slice(0, 2).map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors",
                  active ? "text-brand-orange" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                {t.label}
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <CartTabButton
            active={cartActive}
            itemCount={itemCount}
            badgePulse={badgePulse}
            onPress={onCartPress}
          />
        </li>
        {linkTabs.slice(2).map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors",
                  active ? "text-brand-orange" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
