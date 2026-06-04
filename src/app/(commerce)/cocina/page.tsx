import { getKitchenOrders } from "@/modules/orders/queries";
import { KdsClient } from "./kds-client";

export const dynamic = "force-dynamic";

/**
 * Pantalla de cocina (KDS) en tiempo real.
 * Carga los tickets activos y delega las actualizaciones en vivo al cliente
 * (Supabase Realtime). Ver migración 0004 (publicación realtime).
 */
export default async function CocinaPage() {
  const orders = await getKitchenOrders();
  return <KdsClient initialOrders={orders} />;
}
