import Link from "next/link";

import { PageHeader } from "@/components/brand/page-header";
import { buttonVariants } from "@/components/ui/button";
import { listOrders } from "@/modules/orders/queries";

import { OrdersClient } from "./orders-client";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const orders = await listOrders({ limit: 50 });

  return (
    <div className="pedigo-page">
      <PageHeader
        kicker="Operación"
        title="Pedidos"
        description="Gestiona domicilios, WhatsApp y ventas de mostrador en un solo flujo."
        action={
          <Link href="/pos" className={buttonVariants({ variant: "outline" })}>
            Ir al POS
          </Link>
        }
      />
      <OrdersClient orders={orders} />
    </div>
  );
}
