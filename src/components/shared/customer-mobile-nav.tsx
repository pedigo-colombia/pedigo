"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Receipt, ShoppingBag, Store } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/cuenta", label: "Inicio", icon: Home },
  { href: "/pedir", label: "Pedir", icon: Store },
  { href: "/mis-pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/direcciones", label: "Direcciones", icon: MapPin },
  { href: "/mis-facturas", label: "Facturas", icon: Receipt },
] as const;

export function CustomerMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur sm:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 py-1.5">
        {tabs.map((t) => {
          const active =
            pathname === t.href ||
            (t.href === "/pedir" && pathname.startsWith("/pedir/"));
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
