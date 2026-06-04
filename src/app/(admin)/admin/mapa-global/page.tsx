import { DashboardPage } from "@/components/shared/dashboard-page";
import { PageHeader } from "@/components/shared/page-header";
import { getGlobalMapData } from "@/modules/admin/queries";
import { MapaGlobalClient } from "./mapa-global-client";

export const dynamic = "force-dynamic";

export default async function MapaGlobalPage() {
  const data = await getGlobalMapData();
  return (
    <DashboardPage>
      <PageHeader
        title="Mapa global"
        description="Comercios, repartidores y pedidos activos en la plataforma."
      />
      <MapaGlobalClient
        commerces={data.commerces}
        couriers={data.couriers}
        orders={data.orders}
      />
    </DashboardPage>
  );
}
