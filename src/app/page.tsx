import Link from "next/link";
import {
  ChefHat,
  MapPin,
  Receipt,
  Shield,
  ShoppingBag,
  Store,
  Truck,
  User,
  Wallet,
} from "lucide-react";

import { LandingHeader } from "@/components/landing/landing-header";
import { LandingImage } from "@/components/landing/landing-image";
import { PedigoLogo } from "@/components/brand/pedigo-logo";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { signInPath, signUpPath } from "@/lib/auth/access-types";
import { landingImages } from "@/lib/landing/images";
import { getSession } from "@/modules/auth/session";

const features = [
  {
    icon: ShoppingBag,
    title: "POS + Pedidos",
    desc: "Ventas presenciales, app y WhatsApp desde una sola interfaz rápida.",
  },
  {
    icon: Wallet,
    title: "Caja y arqueo",
    desc: "Apertura, cierre y movimientos de caja por empleado.",
  },
  {
    icon: ChefHat,
    title: "Cocina (KDS)",
    desc: "Pantalla de cocina en tiempo real con prioridad y tiempos.",
  },
  {
    icon: Truck,
    title: "Delivery",
    desc: "Repartidores propios o compartidos con asignación por cercanía.",
  },
  {
    icon: MapPin,
    title: "Tracking en vivo",
    desc: "Tu cliente sigue el pedido en mapa hasta la puerta.",
  },
  {
    icon: Receipt,
    title: "Facturación DIAN",
    desc: "Factura electrónica lista para cumplir con la normativa colombiana.",
  },
];

const ecosystem = [
  {
    icon: User,
    title: "Clientes",
    desc: "Mapa de restaurantes, pedidos a domicilio, seguimiento y facturas.",
    primary: { label: "Pedir ahora", href: signUpPath("cliente") },
    secondary: { label: "Iniciar sesión", href: signInPath("cliente") },
    panel: "/cuenta",
  },
  {
    icon: Store,
    title: "Comercios",
    desc: "Operación diaria: POS, cocina, inventario, caja y repartidores.",
    primary: { label: "Entrar al panel", href: signInPath("comercio") },
    secondary: { label: "Ver accesos", href: "/acceso" },
    panel: "/inicio",
  },
  {
    icon: Shield,
    title: "Administración",
    desc: "Alta de restaurantes, usuarios, mapa global y métricas de plataforma.",
    primary: { label: "Panel admin", href: signInPath("admin") },
    secondary: { label: "Acceso seguro", href: "/acceso" },
    panel: "/admin",
  },
];

const steps = [
  {
    n: "1",
    title: "Elige tu rol",
    desc: "Cliente, comercio o administrador — cada uno con su entrada dedicada.",
  },
  {
    n: "2",
    title: "Inicia sesión",
    desc: "Clerk gestiona la seguridad; PediGo te lleva al panel correcto.",
  },
  {
    n: "3",
    title: "Opera en vivo",
    desc: "Pedidos, cocina, delivery y facturación sincronizados en tiempo real.",
  },
];

export default async function LandingPage() {
  const session = await getSession();
  const isSignedIn = Boolean(session.userId);

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <LandingHeader isSignedIn={isSignedIn} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/80">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div className="relative z-10 flex flex-col gap-6 text-center lg:text-left">
            <span className="mx-auto inline-flex rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-brand-orange lg:mx-0">
              Plataforma de comida para restaurantes en Colombia 🇨🇴
            </span>
            <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-brand-navy sm:text-5xl lg:text-6xl dark:text-foreground">
              Más pedidos. Más ventas.{" "}
              <span className="text-brand-orange">Menos líos.</span>
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Domicilios, WhatsApp, POS, cocina, delivery en vivo y facturación electrónica.
              Un ecosistema conectado para clientes, restaurantes y operación PediGo.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              {isSignedIn ? (
                <ButtonLink href="/post-login" size="lg">
                  Continuar en mi panel
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink href={signUpPath("cliente")} size="lg">
                    Quiero pedir comida
                  </ButtonLink>
                  <ButtonLink href={signInPath("comercio")} size="lg" variant="outline">
                    Soy restaurante
                  </ButtonLink>
                </>
              )}
              <ButtonLink href="/acceso" variant="secondary" size="lg">
                Ver todos los accesos
              </ButtonLink>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border shadow-xl lg:aspect-square">
            <LandingImage
              localSrc={landingImages.hero.src}
              fallbackSrc={landingImages.hero.fallback}
              alt={landingImages.hero.alt}
              priority
            />
          </div>
        </div>
      </section>

      {/* Ecosistema */}
      <section id="ecosistema" className="scroll-mt-20 border-b border-border/80 bg-muted/30 py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <p className="pedigo-kicker">Ecosistema PediGo</p>
            <h2 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">
              Tres portales, una sola plataforma
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Cada perfil entra por su puerta y llega al lugar correcto tras iniciar sesión.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {ecosystem.map((e) => {
              const Icon = e.icon;
              return (
                <Card key={e.title} className="flex flex-col p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-orange/15 text-brand-orange">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading text-xl font-bold">{e.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{e.desc}</p>
                  <div className="mt-5 flex flex-col gap-2">
                    <ButtonLink
                      href={isSignedIn ? e.panel : e.primary.href}
                      className="w-full"
                    >
                      {isSignedIn ? "Ir al panel" : e.primary.label}
                    </ButtonLink>
                    {!isSignedIn && (
                      <ButtonLink href={e.secondary.href} variant="outline" className="w-full">
                        {e.secondary.label}
                      </ButtonLink>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bloques con imagen */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-2">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-border shadow-lg">
            <LandingImage
              localSrc={landingImages.mapa.src}
              fallbackSrc={landingImages.mapa.fallback}
              alt={landingImages.mapa.alt}
            />
          </div>
          <div>
            <p className="pedigo-kicker">Para clientes</p>
            <h2 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">
              Pide como en las apps que ya conoces
            </h2>
            <p className="mt-3 text-muted-foreground">
              Mapa de restaurantes cercanos, carrito, domicilio o recoger, y barra de progreso
              de tu pedido hasta la entrega.
            </p>
            <ButtonLink href={isSignedIn ? "/cuenta" : signUpPath("cliente")} className="mt-5">
              {isSignedIn ? "Abrir mapa de restaurantes" : "Crear cuenta de cliente"}
            </ButtonLink>
          </div>
        </div>
        <div className="mx-auto mt-16 grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-2">
          <div className="lg:order-2">
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-border shadow-lg">
              <LandingImage
                localSrc={landingImages.pos.src}
                fallbackSrc={landingImages.pos.fallback}
                alt={landingImages.pos.alt}
              />
            </div>
          </div>
          <div className="lg:order-1">
            <p className="pedigo-kicker">Para comercios</p>
            <h2 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">
              Tu operación diaria en un solo panel
            </h2>
            <p className="mt-3 text-muted-foreground">
              POS, pantalla de cocina, inventario, repartidores y facturación. Acceso por
              invitación del administrador PediGo.
            </p>
            <ButtonLink href={signInPath("comercio")} className="mt-5">
              Entrar como comercio
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Funciones */}
      <section id="funciones" className="scroll-mt-20 border-t border-border/80 bg-muted/40 py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <h2 className="font-heading text-3xl font-bold">Todo lo que necesita tu restaurante</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="pedigo-card flex gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-brand-orange">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-heading text-base font-bold">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="scroll-mt-20 py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-heading text-3xl font-bold">Cómo funciona</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <li
                key={s.n}
                className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-orange text-lg font-bold text-white">
                  {s.n}
                </span>
                <h3 className="mt-4 font-heading text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/acceso" size="lg">
              Elegir tipo de acceso
            </ButtonLink>
            <ButtonLink href="#ecosistema" size="lg" variant="outline">
              Ver ecosistema
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-border/80 bg-brand-navy py-16 text-white dark:bg-card">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-heading text-3xl font-bold">
            ¿Listo para simplificar tu restaurante?
          </h2>
          <p className="mt-3 text-white/80 dark:text-muted-foreground">
            Activa PediGo con tu equipo o empieza a pedir como cliente en minutos.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink
              href={signUpPath("cliente")}
              size="lg"
              className="bg-brand-orange text-white hover:bg-[#e66f00]"
            >
              Registro cliente
            </ButtonLink>
            <ButtonLink
              href={signInPath("comercio")}
              size="lg"
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10 dark:border-border dark:text-foreground"
            >
              Acceso comercio
            </ButtonLink>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-border/80">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <PedigoLogo size="sm" />
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/acceso" className="hover:text-brand-orange">
              Accesos
            </Link>
            <Link href={signInPath("cliente")} className="hover:text-brand-orange">
              Clientes
            </Link>
            <Link href={signInPath("comercio")} className="hover:text-brand-orange">
              Comercios
            </Link>
            <Link href={signInPath("admin")} className="hover:text-brand-orange">
              Admin
            </Link>
          </div>
          <span>© {new Date().getFullYear()} PediGo</span>
        </div>
      </footer>
    </main>
  );
}
