import { getGlobalMapData } from "@/modules/admin/queries";
import { MapaGlobalClient } from "./mapa-global-client";

export const dynamic = "force-dynamic";

export default async function MapaGlobalPage() {
  const data = await getGlobalMapData();
  return (
    <MapaGlobalClient
      commerces={data.commerces}
      couriers={data.couriers}
      orders={data.orders}
    />
  );
}
