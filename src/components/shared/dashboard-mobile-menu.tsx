"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import {
  Building2,
  ChefHat,
  Home,
  LayoutGrid,
  ListOrdered,
  MapPin,
  Package,
  Receipt,
  Settings,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { IconName, NavItem } from "./nav-config";

const ICONS = {
  Home,
  LayoutGrid,
  ListOrdered,
  Users,
  Wallet,
  Package,
  ChefHat,
  Truck,
  MapPin,
  Receipt,
  Settings,
  Building2,
} as const satisfies Record<IconName, React.ComponentType<{ className?: string }>>;

/** Menú completo en móvil (hamburguesa) para paneles con muchas secciones. */
export function DashboardMobileMenu({
  items,
  title,
  trigger,
  className,
}: {
  items: NavItem[];
  title: string;
  /** Trigger personalizado (p. ej. pestaña «Más» en barra inferior). */
  trigger?: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger
        className={className}
        render={
          trigger ? (
            <button type="button" className="w-full">
              {trigger}
            </button>
          ) : (
            <Button
              variant="outline"
              size="icon-sm"
              className="md:hidden"
              aria-label="Abrir menú"
            />
          )
        }
      >
        {!trigger ? <Menu className="h-4 w-4" /> : null}
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(100%,280px)] p-0">
        <SheetHeader className="border-b px-4 py-4 text-left">
          <SheetTitle className="font-heading text-base">{title}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-0.5 p-3">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/inicio" &&
                item.href !== "/admin" &&
                pathname.startsWith(item.href + "/")) ||
              (item.href === "/admin" && pathname === "/admin");
            const Icon = ICONS[item.icon];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-brand-orange text-white"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
