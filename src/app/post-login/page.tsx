import { redirect } from "next/navigation";

import { getSession } from "@/modules/auth/session";

/**
 * Enrutador post-login.
 * Decide el panel según el rol resuelto del usuario.
 */
export default async function PostLoginPage() {
  const session = await getSession();

  if (!session.userId) redirect("/sign-in");
  if (session.isSuperadmin) redirect("/admin");

  if (session.organizationId) {
    if (session.orgRole === "courier") redirect("/courier");
    redirect("/inicio");
  }

  // Sin organización => cliente final.
  redirect("/cuenta");
}
