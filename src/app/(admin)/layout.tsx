import { redirect } from "next/navigation";
import { AdminMobileNav } from "@/components/shared/admin-mobile-nav";
import { DashboardMobileMenu } from "@/components/shared/dashboard-mobile-menu";
import { DashboardSidebar } from "@/components/shared/dashboard-sidebar";
import { HeaderActions } from "@/components/shared/header-actions";
import { adminNav } from "@/components/shared/nav-config";
import { getSession } from "@/modules/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.userId) redirect("/sign-in");
  if (!session.isSuperadmin) redirect("/post-login");

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar items={adminNav} title="Superadmin" />
      <div className="flex min-h-screen flex-1 flex-col pb-16 md:pb-0">
        <header className="flex h-16 items-center justify-between gap-2 border-b border-border bg-card px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <DashboardMobileMenu items={adminNav} title="Plataforma PediGo" />
            <h1 className="truncate font-heading text-base font-bold sm:text-lg">
              Plataforma PediGo
            </h1>
          </div>
          <HeaderActions />
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
        <AdminMobileNav />
      </div>
    </div>
  );
}
