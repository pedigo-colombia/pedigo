import {
  getCommercePoint,
  getDeliveryOrders,
  listCouriers,
} from "@/modules/delivery/queries";
import { MapaClient } from "./mapa-client";

export const dynamic = "force-dynamic";

export default async function MapaPage() {
  const [commerce, couriers, orders] = await Promise.all([
    getCommercePoint(),
    listCouriers(),
    getDeliveryOrders(),
  ]);

  return (
    <MapaClient commerce={commerce} couriers={couriers} orders={orders} />
  );
}
