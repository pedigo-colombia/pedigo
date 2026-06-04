import Link from "next/link";
import {
  ChefHat,
  MapPin,
  Receipt,
  ShoppingBag,
  Truck,
  Wallet,
} from "lucide-react";

import { PedigoLogo } from "@/components/brand/pedigo-logo";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";

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

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <PedigoLogo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/sign-in" className={buttonVariants({ variant: "ghost" })}>
              Iniciar sesión
            </Link>
            <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
              Prueba PediGo gratis
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-4 py-20 text-center sm:py-28">
        <span className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-brand-orange">
          Hecho para restaurantes en Colombia 🇨🇴
        </span>
        <h1 className="max-w-3xl font-heading text-4xl font-extrabold leading-tight tracking-tight text-brand-navy sm:text-5xl lg:text-6xl dark:text-foreground">
          Más pedidos. Más ventas.{" "}
          <span className="text-brand-orange">Menos líos.</span>
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Domicilios, WhatsApp, POS, cocina, delivery en vivo y facturación electrónica.
          Todo en un solo lugar, pensado para la operación real de tu restaurante.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
            Empezar ahora
          </Link>
          <Link
            href="/sign-in"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            Conoce más
          </Link>
        </div>
      </section>

      <section className="border-t border-border/80 bg-muted/40">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 py-16 sm:grid-cols-2 lg:grid-cols-3 lg:py-20">
          {features.map((f) => (
            <div key={f.title} className="pedigo-card flex gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-brand-orange">
                <f.icon className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="font-heading text-base font-bold">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-auto border-t border-border/80">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <PedigoLogo size="sm" />
          <span>© {new Date().getFullYear()} PediGo · pedigo.lat</span>
        </div>
      </footer>
    </main>
  );
}
