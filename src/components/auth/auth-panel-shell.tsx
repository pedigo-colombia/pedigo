import Link from "next/link";
import { ArrowLeft, Building2, Shield, User } from "lucide-react";

import { PedigoLogo } from "@/components/brand/pedigo-logo";
import { ButtonLink } from "@/components/ui/button-link";
import {
  type AccessTipo,
  ACCESS_LABELS,
  parseAccessTipo,
  signInPath,
  signUpPath,
} from "@/lib/auth/access-types";

const ICONS = {
  cliente: User,
  comercio: Building2,
  admin: Shield,
} as const;

export function AuthPanelShell({
  tipo,
  children,
}: {
  tipo?: string | null;
  children: React.ReactNode;
}) {
  const access = parseAccessTipo(tipo) ?? "cliente";
  const meta = ACCESS_LABELS[access];
  const Icon = ICONS[access];

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b border-border/80 bg-card/90 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link href="/">
            <PedigoLogo size="sm" />
          </Link>
          <ButtonLink href="/" variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Inicio
          </ButtonLink>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-8">
        <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-orange/15 text-brand-orange">
            <Icon className="h-6 w-6" />
          </div>
          <h1 className="font-heading text-xl font-bold">{meta.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{meta.subtitle}</p>
          <p className="mt-1 text-xs text-muted-foreground">{meta.signInHint}</p>
        </div>

        <div className="flex justify-center">{children}</div>

        <div className="text-center text-sm text-muted-foreground">
          <p className="mb-3 font-medium">¿Otro tipo de acceso?</p>
          <div className="flex flex-wrap justify-center gap-2">
            {(["cliente", "comercio", "admin"] as AccessTipo[])
              .filter((t) => t !== access)
              .map((t) => (
                <ButtonLink key={t} href={signInPath(t)} variant="outline" size="sm">
                  {ACCESS_LABELS[t].title}
                </ButtonLink>
              ))}
          </div>
          {access === "cliente" && (
            <p className="mt-4">
              ¿Sin cuenta?{" "}
              <Link href={signUpPath("cliente")} className="font-semibold text-brand-orange hover:underline">
                Regístrate gratis
              </Link>
            </p>
          )}
          {access === "comercio" && (
            <p className="mt-4 text-xs">
              Los restaurantes se activan por el equipo PediGo. Si necesitas acceso, contacta a soporte.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
