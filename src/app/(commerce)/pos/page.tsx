import { getCatalog } from "@/modules/pos/queries";
import { getActiveCashSession } from "@/modules/cash/queries";

import { PosClient } from "./pos-client";

export const dynamic = "force-dynamic";

/**
 * POS — pantalla principal operativa del comercio.
 * Ventas presenciales, registro manual de WhatsApp y pedidos de app desde una
 * sola interfaz. Recalcula precios y totales en el servidor (ver actions.ts).
 */
export default async function PosPage() {
  const [catalog, cash] = await Promise.all([
    getCatalog(),
    getActiveCashSession(),
  ]);

  return <PosClient catalog={catalog} hasOpenCash={cash !== null} />;
}
