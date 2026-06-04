import Link from "next/link";
import { Building2, Shield, User } from "lucide-react";

import { SelectOrganizationHint } from "@/components/auth/select-organization-hint";
import { PedigoLogo } from "@/components/brand/pedigo-logo";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { ACCESS_LABELS, signInPath, signUpPath } from "@/lib/auth/access-types";

const portals = [
  {
    tipo: "cliente" as const,
    icon: User,
    cta: "Crear cuenta / Entrar",
    href: signUpPath("cliente"),
    also: { label: "Ya tengo cuenta", href: signInPath("cliente") },
  },
  {
    tipo: "comercio" as const,
    icon: Building2,
    cta: "Entrar al panel",
    href: signInPath("comercio"),
    also: { label: "Volver al inicio", href: "/" },
  },
  {
    tipo: "admin" as const,
    icon: Shield,
    cta: "Acceso administrador",
    href: signInPath("admin"),
    also: { label: "Volver al inicio", href: "/" },
  },
];

export default async function AccesoPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string; tipo?: string }>;
}) {
  const { aviso, tipo } = await searchParams;
  const showOrgHint = aviso === "sin-organizacion";
  const comercioIntent = tipo === "comercio";

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/80 px-4 py-5">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/">
            <PedigoLogo size="md" />
          </Link>
          <ButtonLink href="/" variant="ghost" size="sm">
            Inicio
          </ButtonLink>
        </div>
      </header>

      <section className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            ¿Cómo quieres entrar?
          </h1>
          <p className="mt-3 text-muted-foreground">
            PediGo conecta clientes, restaurantes y operación de plataforma en un solo ecosistema.
          </p>
          {showOrgHint && (
            <p className="mx-auto mt-4 max-w-md rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
              {comercioIntent
                ? "Selecciona el restaurante activo (arriba) para entrar al panel del comercio. Si no aparece ninguno, pide la invitación al administrador PediGo."
                : "Tu usuario no tiene un comercio asignado. Pide al administrador PediGo que te invite al restaurante, o entra como cliente."}
            </p>
          )}
          {showOrgHint && comercioIntent && <SelectOrganizationHint />}
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {portals.map((p) => {
            const meta = ACCESS_LABELS[p.tipo];
            const Icon = p.icon;
            return (
              <Card
                key={p.tipo}
                className="flex flex-col p-6 transition-shadow hover:border-brand-orange/50 hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-orange/15 text-brand-orange">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="font-heading text-lg font-bold">{meta.title}</h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{meta.subtitle}</p>
                <ButtonLink href={p.href} className="mt-5 w-full" size="lg">
                  {p.cta}
                </ButtonLink>
                <Link
                  href={p.also.href}
                  className="mt-3 text-center text-sm font-semibold text-brand-orange hover:underline"
                >
                  {p.also.label}
                </Link>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
