import Link from "next/link";

import { CustomerOrdersList } from "@/components/customer/order-progress-track";
import { PageHeader } from "@/components/brand/page-header";
import { Button } from "@/components/ui/button";
import { getMyOrders } from "@/modules/tracking/queries";

export const dynamic = "force-dynamic";

export default async function MisPedidosPage() {
  const orders = await getMyOrders();

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      <PageHeader
        kicker="Tu cuenta"
        title="Mis pedidos"
        description="Sigue el avance de cada pedido en tiempo real."
        action={
          <Link href="/pedir" className="inline-flex">
            <Button variant="outline" size="sm" type="button">
              Nuevo pedido
            </Button>
          </Link>
        }
      />
      <CustomerOrdersList orders={orders} />
    </div>
  );
}
