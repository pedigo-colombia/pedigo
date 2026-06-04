import { listMyAddresses } from "@/modules/customers/queries";
import { listActiveCommercesForDiscovery } from "@/modules/orders/catalog-public";
import { PedirCommercesList } from "@/components/customer/pedir-commerces-list";

export const dynamic = "force-dynamic";

const BOGOTA: [number, number] = [-74.08, 4.65];

export default async function PedirPage() {
  const [commerces, addresses] = await Promise.all([
    listActiveCommercesForDiscovery(),
    listMyAddresses(),
  ]);

  const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
  const center: [number, number] =
    defaultAddr?.lat != null && defaultAddr?.lng != null
      ? [defaultAddr.lng, defaultAddr.lat]
      : commerces.length > 0
        ? [commerces[0].lng, commerces[0].lat]
        : BOGOTA;

  return <PedirCommercesList commerces={commerces} center={center} />;
}
