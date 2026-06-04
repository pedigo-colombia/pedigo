import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";

import { AuthPanelShell } from "@/components/auth/auth-panel-shell";
import { parseAccessTipo, signInPath } from "@/lib/auth/access-types";

/**
 * Registro solo para clientes finales.
 * Comercios y admin: solo inicio de sesión (invitación / superadmin).
 */
export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo: tipoRaw } = await searchParams;
  const tipo = parseAccessTipo(tipoRaw);

  if (tipo === "comercio" || tipo === "admin") {
    redirect(signInPath(tipo));
  }

  return (
    <AuthPanelShell tipo="cliente">
      <SignUp
        appearance={{ elements: { rootBox: "mx-auto w-full" } }}
        signInUrl={signInPath("cliente")}
        forceRedirectUrl="/post-login"
        fallbackRedirectUrl="/post-login"
      />
    </AuthPanelShell>
  );
}
