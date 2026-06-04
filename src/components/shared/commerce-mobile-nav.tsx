"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListOrdered, Receipt, ShoppingBag, Users } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/inicio", label: "Inicio", icon: Home },
  { href: "/pedidos", label: "Pedidos", icon: ListOrdered },
  { href: "/pos", label: "Vender", icon: ShoppingBag },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/facturacion", label: "Facturas", icon: Receipt },
];

/** Navegación inferior móvil (guía app PediGo). */
export function CommerceMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 px-2 pb-3 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-between">
        {tabs.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold",
                active ? "text-brand-orange" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
