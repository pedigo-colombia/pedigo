import { redirect } from "next/navigation";

import { CommerceMobileNav } from "@/components/shared/commerce-mobile-nav";
import { DashboardSidebar } from "@/components/shared/dashboard-sidebar";
import { DashboardTopbar } from "@/components/shared/dashboard-topbar";
import { commerceNav } from "@/components/shared/nav-config";
import { getSession } from "@/modules/auth/session";

export default async function CommerceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session.userId) redirect("/sign-in");
  if (!session.organizationId) {
    redirect("/acceso?aviso=sin-organizacion&tipo=comercio");
  }
  if (session.orgRole === "courier") redirect("/courier");

  return (
    <div className="dashboard-panel bg-background">
      <DashboardSidebar items={commerceNav} title="Tu restaurante" />
      <div className="dashboard-panel-main pb-16 md:pb-0">
        <DashboardTopbar
          heading="PediGo Comercio"
          accessTipo="comercio"
          menuItems={commerceNav}
          menuTitle="Tu restaurante"
        />
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
      <CommerceMobileNav />
    </div>
  );
}
