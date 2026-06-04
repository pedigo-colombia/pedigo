import { getActiveCashSession } from "@/modules/cash/queries";

import { CashClient } from "./cash-client";

export const dynamic = "force-dynamic";

export default async function CajaPage() {
  const session = await getActiveCashSession();
  return <CashClient session={session} />;
}
