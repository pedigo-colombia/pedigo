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

  // Superadmin: respetar si entró como comercio o como plataforma
  if (session.isSuperadmin) {
    if (intent === "comercio") {
      if (session.organizationId) redirect("/inicio");
      redirect("/acceso?aviso=sin-organizacion&tipo=comercio");
    }
    redirect("/admin");
  }

  if (session.organizationId) {
    if (session.orgRole === "courier") redirect("/courier");
    redirect("/inicio");
  }

  if (intent === "comercio" || intent === "admin") {
    redirect("/acceso?aviso=sin-organizacion");
  }

  redirect("/cuenta");
}
