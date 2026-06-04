import { listMyAddresses } from "@/modules/customers/queries";
import { DireccionesClient } from "./direcciones-client";

export const dynamic = "force-dynamic";

export default async function DireccionesPage() {
  const addresses = await listMyAddresses();
  return <DireccionesClient addresses={addresses} />;
}
