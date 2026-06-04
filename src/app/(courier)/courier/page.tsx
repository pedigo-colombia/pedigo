import { getMyCourierContext } from "@/modules/delivery/courier-queries";
import { CourierClient } from "./courier-client";

export const dynamic = "force-dynamic";

export default async function CourierDashboardPage() {
  const ctx = await getMyCourierContext();
  return <CourierClient context={ctx} />;
}
