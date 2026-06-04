import Link from "next/link";
import { redirect } from "next/navigation";

import { PedigoLogo } from "@/components/brand/pedigo-logo";
import { CustomerMobileNav } from "@/components/shared/customer-mobile-nav";
import { HeaderActions } from "@/components/shared/header-actions";
import { getSession } from "@/modules/auth/session";
import { cn } from "@/lib/utils";

const links = [
  { href: "/cuenta", label: "Inicio" },
  { href: "/pedir", label: "Pedir" },
  { href: "/mis-pedidos", label: "Mis pedidos" },
  { href: "/mis-facturas", label: "Facturas" },
  { href: "/direcciones", label: "Direcciones" },
];

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.userId) redirect("/sign-in");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border/80 bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-6">
            <Link href="/cuenta">
              <PedigoLogo size="sm" />
            </Link>
            <nav className="hidden gap-1 sm:flex">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <HeaderActions />
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-8">{children}</main>
      <CustomerMobileNav />
    </div>
  );
}
