import { notFound } from "next/navigation";

import { getOrderTracking } from "@/modules/tracking/queries";
import { TrackClient } from "./track-client";

export const dynamic = "force-dynamic";

export default async function TrackPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const tracking = await getOrderTracking(orderId);
  if (!tracking) notFound();

  return <TrackClient tracking={tracking} />;
}
