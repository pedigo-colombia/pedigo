import { Building2, Receipt, Truck, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardPage } from "@/components/shared/dashboard-page";
import { PageHeader } from "@/components/shared/page-header";
import { getPlatformStats } from "@/modules/admin/queries";

export default async function AdminDashboardPage() {
  const stats = await getPlatformStats();

  const kpis = [
    { label: "Comercios", value: String(stats.organizations), icon: Building2 },
    { label: "Usuarios", value: String(stats.users), icon: Users },
    { label: "Repartidores", value: String(stats.couriers), icon: Truck },
    { label: "Facturas emitidas", value: String(stats.invoices), icon: Receipt },
  ];

  return (
    <DashboardPage>
      <PageHeader
        title="Resumen de la plataforma"
        description="Control global. El superadmin crea comercios e invita a sus usuarios."
      />
      <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {k.label}
              </CardTitle>
              <k.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardPage>
  );
}
