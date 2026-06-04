import { redirect } from "next/navigation";

import { parseAccessTipo } from "@/lib/auth/access-types";
import { getSession } from "@/modules/auth/session";

/**
 * Enrutador post-login: envía cada perfil a su panel.
 */
export default async function PostLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const session = await getSession();
  const { tipo: tipoRaw } = await searchParams;
  const intent = parseAccessTipo(tipoRaw);

  if (!session.userId) redirect("/acceso");

  if (session.isSuperadmin) redirect("/admin");

  if (session.organizationId) {
    if (session.orgRole === "courier") redirect("/courier");
    redirect("/inicio");
  }

  // Sin organización activa: cliente. Si intentó comercio sin org, guía a accesos.
  if (intent === "comercio" || intent === "admin") {
    redirect("/acceso?aviso=sin-organizacion");
  }

  redirect("/cuenta");
}
