import Link from "next/link";
import {
  BarChart3,
  MessageCircle,
  Plus,
  Receipt,
  ShoppingBag,
  Truck,
} from "lucide-react";

import { PageHeader } from "@/components/brand/page-header";
import { QuickAction } from "@/components/brand/quick-action";
import { StatCard } from "@/components/brand/stat-card";
import { FiscalStatusBanner } from "@/components/brand/fiscal-status-banner";
import { buttonVariants } from "@/components/ui/button";
import { formatCOP } from "@/lib/format";
import { getCommerceDashboard } from "@/modules/commerce/dashboard-queries";
import { getSessionWithUser } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

export default async function InicioPage() {
  const { user } = await getSessionWithUser();
  const data = await getCommerceDashboard(user?.firstName);

  return (
    <div className="pedigo-page">
      <PageHeader
        kicker="Panel del comercio"
        title={`¡Hola, ${data.greetingName}!`}
        description="Resumen de hoy: ventas, pedidos y facturación en un vistazo."
        action={
          <Link href="/pos" className={buttonVariants({ size: "lg" })}>
            <Plus className="mr-1 h-4 w-4" />
            Nuevo pedido
          </Link>
        }
      />

      <FiscalStatusBanner status={data.fiscalStatus} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ventas del día"
          value={formatCOP(data.salesToday)}
          icon={ShoppingBag}
          hint="Pedidos activos de hoy"
        />
        <StatCard
          label="Pedidos"
          value={String(data.ordersToday)}
          icon={BarChart3}
          hint={
            data.pendingOrders > 0
              ? `${data.pendingOrders} en curso ahora`
              : "Sin pendientes"
          }
        />
        <StatCard
          label="Domicilios"
          value={String(data.deliveriesToday)}
          icon={Truck}
          hint="Con dirección de entrega"
        />
        <StatCard
          label="Facturas hoy"
          value={String(data.invoicesToday)}
          icon={Receipt}
          hint="Emitidas o aceptadas"
        />
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-bold">Accesos rápidos</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickAction href="/pos" label="Nuevo pedido" icon={Plus} accent="orange" />
          <QuickAction href="/pedidos" label="Pedidos" icon={ShoppingBag} accent="navy" />
          <QuickAction href="/facturacion" label="Facturación" icon={Receipt} accent="green" />
          <QuickAction href="/pedidos" label="WhatsApp" icon={MessageCircle} accent="info" />
        </div>
      </section>
    </div>
  );
}
