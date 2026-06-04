import Link from "next/link";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

import { getSession } from "@/modules/auth/session";

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
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur sm:px-8">
        <div className="flex items-center gap-6">
          <Link href="/cuenta" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 font-bold text-white">
              P
            </div>
            <span className="font-semibold">PediGo</span>
          </Link>
          <nav className="hidden gap-4 text-sm text-muted-foreground sm:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-foreground">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <UserButton />
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-8">
        {children}
      </main>
    </div>
  );
}
