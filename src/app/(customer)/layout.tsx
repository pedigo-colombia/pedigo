import Link from "next/link";
import { redirect } from "next/navigation";

import { PedigoLogo } from "@/components/brand/pedigo-logo";
import { CustomerLayoutShell } from "@/components/customer/customer-layout-shell";
import { CustomerNavLinks } from "@/components/shared/customer-nav-links";
import { HeaderActions } from "@/components/shared/header-actions";
import { getSession } from "@/modules/auth/session";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.userId) redirect("/sign-in");

  return (
    <CustomerLayoutShell>
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-10 border-b border-border/80 bg-card/95 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4 sm:px-8">
            <div className="flex items-center gap-6">
              <Link href="/cuenta">
                <PedigoLogo size="md" />
              </Link>
              <CustomerNavLinks />
            </div>
            <HeaderActions />
          </div>
        </header>
        <main className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col p-4 sm:p-8">
          {children}
        </main>
      </div>
    </CustomerLayoutShell>
  );
}
