import { redirect } from "next/navigation";

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
  // Requiere organización activa (tenant). Couriers van a su propio panel.
  if (!session.organizationId && !session.isSuperadmin) {
    redirect("/cuenta");
  }
  if (session.orgRole === "courier") redirect("/courier");

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar items={commerceNav} title="Comercio" />
      <div className="flex flex-1 flex-col">
        <DashboardTopbar heading="Panel del comercio" />
        <main className="flex-1 overflow-auto bg-muted/10">{children}</main>
      </div>
    </div>
  );
}
