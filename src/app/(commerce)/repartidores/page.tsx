import { getDeliveryOrders, listCouriers } from "@/modules/delivery/queries";
import { RepartidoresClient } from "./repartidores-client";

export const dynamic = "force-dynamic";

export default async function RepartidoresPage() {
  const [couriers, orders] = await Promise.all([
    listCouriers(),
    getDeliveryOrders(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">Repartidores y delivery</h2>
        <p className="text-sm text-muted-foreground">
          Repartidores propios o compartidos y asignación de pedidos (manual o
          por cercanía).
        </p>
      </div>
      <RepartidoresClient couriers={couriers} orders={orders} />
    </div>
  );
}
