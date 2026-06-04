import { redirect } from "next/navigation";
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
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <h1 className="font-heading text-lg font-bold">Plataforma PediGo</h1>
          <HeaderActions />
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
