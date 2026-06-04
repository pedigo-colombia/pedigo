"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { href: "/cuenta", label: "Inicio", match: (p: string) => p === "/cuenta" },
  {
    href: "/pedir",
    label: "Pedir",
    match: (p: string) => p === "/pedir" || p.startsWith("/pedir/"),
  },
  { href: "/mis-pedidos", label: "Mis pedidos", match: (p: string) => p === "/mis-pedidos" },
  { href: "/mis-facturas", label: "Facturas", match: (p: string) => p === "/mis-facturas" },
  { href: "/direcciones", label: "Direcciones", match: (p: string) => p === "/direcciones" },
] as const;

export function CustomerNavLinks({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("hidden gap-1 sm:flex", className)}>
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
    </nav>
  );
}
