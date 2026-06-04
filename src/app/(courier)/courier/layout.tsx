import { redirect } from "next/navigation";
import { PedigoLogo } from "@/components/brand/pedigo-logo";
import { HeaderActions } from "@/components/shared/header-actions";
import { getSession } from "@/modules/auth/session";

/**
 * Panel del repartidor — mobile-first (base de la PWA).
 */
export default async function CourierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.userId) redirect("/sign-in");

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <header className="flex h-14 items-center justify-between border-b bg-background px-4">
        <PedigoLogo size="sm" showWordmark />
        <span className="sr-only">Repartidor</span>
        <HeaderActions />
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
