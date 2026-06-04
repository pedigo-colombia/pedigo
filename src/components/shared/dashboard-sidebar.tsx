"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ChefHat,
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

import { cn } from "@/lib/utils";
import type { IconName, NavItem } from "./nav-config";

const ICONS: Record<IconName, ComponentType<{ className?: string }>> = {
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
};

export function DashboardSidebar({
  items,
  title,
}: {
  items: NavItem[];
  title: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-muted/20 md:flex">
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 font-bold text-white">
          P
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-none">PediGo</span>
          <span className="text-xs text-muted-foreground">{title}</span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = ICONS[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-orange-600 text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
