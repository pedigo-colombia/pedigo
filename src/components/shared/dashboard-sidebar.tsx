"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

import { PedigoLogo } from "@/components/brand/pedigo-logo";
import { cn } from "@/lib/utils";
import type { IconName, NavItem } from "./nav-config";

const ICONS: Record<IconName, ComponentType<{ className?: string }>> = {
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
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <PedigoLogo size="sm" />
      </div>
      <p className="px-5 pt-4 text-xs font-medium text-muted-foreground">{title}</p>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/inicio" && pathname.startsWith(item.href + "/"));
          const Icon = ICONS[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-brand-orange text-white shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
