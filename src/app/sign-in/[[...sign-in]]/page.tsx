import { SignIn } from "@clerk/nextjs";

import { AuthPanelShell } from "@/components/auth/auth-panel-shell";
import { parseAccessTipo, signUpPath } from "@/lib/auth/access-types";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo: tipoRaw } = await searchParams;
  const tipo = parseAccessTipo(tipoRaw) ?? "cliente";
  const allowSignUp = tipo === "cliente";
  const afterUrl = `/post-login?tipo=${tipo}`;

  return (
    <AuthPanelShell tipo={tipo}>
      <SignIn
        appearance={{ elements: { rootBox: "mx-auto w-full" } }}
        signUpUrl={allowSignUp ? signUpPath("cliente") : undefined}
        forceRedirectUrl={afterUrl}
        fallbackRedirectUrl={afterUrl}
      />
    </AuthPanelShell>
  );
}
