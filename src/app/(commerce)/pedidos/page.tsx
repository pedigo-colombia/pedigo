import { listOrders } from "@/modules/orders/queries";

import { OrdersClient } from "./orders-client";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const orders = await listOrders({ limit: 50 });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">Pedidos</h2>
        <p className="text-sm text-muted-foreground">
          Gestiona el flujo de pedidos por canal y actualiza su estado.
        </p>
      </div>
      <OrdersClient orders={orders} />
    </div>
  );
}
