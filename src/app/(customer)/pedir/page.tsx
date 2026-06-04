import { PedirCommercesList } from "@/components/customer/pedir-commerces-list";
import { MONTERIA_CENTER } from "@/data/monteria-commerce";
import { listMyAddresses } from "@/modules/customers/queries";
import { listActiveCommercesForDiscovery } from "@/modules/orders/catalog-public";

export const dynamic = "force-dynamic";

const DEFAULT_CENTER: [number, number] = [
  MONTERIA_CENTER.lng,
  MONTERIA_CENTER.lat,
];

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
        : DEFAULT_CENTER;

  return <PedirCommercesList commerces={commerces} center={center} />;
}
