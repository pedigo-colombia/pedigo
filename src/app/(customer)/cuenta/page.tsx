import { CommerceDiscoveryHome } from "@/components/customer/commerce-discovery-home";
import { MONTERIA_CENTER } from "@/data/monteria-commerce";
import { listMyAddresses } from "@/modules/customers/queries";
import { listActiveCommercesForDiscovery } from "@/modules/orders/catalog-public";
import { getSessionWithUser } from "@/modules/auth/session";

const DEFAULT_CENTER: [number, number] = [
  MONTERIA_CENTER.lng,
  MONTERIA_CENTER.lat,
];

export default async function CuentaPage() {
  const [{ user }, commerces, addresses] = await Promise.all([
    getSessionWithUser(),
    listActiveCommercesForDiscovery(),
    listMyAddresses(),
  ]);

  const name = user?.firstName ?? "👋";
  const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
  const hasUserLocation = defaultAddr?.lat != null && defaultAddr?.lng != null;
  const center: [number, number] = hasUserLocation
    ? [defaultAddr!.lng!, defaultAddr!.lat!]
    : commerces.length > 0
      ? [commerces[0].lng, commerces[0].lat]
      : DEFAULT_CENTER;

  return (
    <CommerceDiscoveryHome
      commerces={commerces}
      userName={name}
      center={center}
      hasUserLocation={hasUserLocation}
    />
  );
}
