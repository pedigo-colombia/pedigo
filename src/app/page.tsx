import Link from "next/link";
import {
  ChefHat,
  MapPin,
  Receipt,
  ShoppingBag,
  Truck,
  Wallet,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

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
    desc: "ETA, ruta y repartidor en vivo sobre Mapbox para el cliente.",
  },
  {
    icon: Receipt,
    title: "Facturación",
    desc: "Motor fiscal propio, listo para DIAN (software propio).",
  },
];

export default function LandingPage() {
  return (
    <main className="flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 font-bold text-white">
              P
            </div>
            <span className="text-lg font-semibold">PediGo</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/sign-in" className={buttonVariants({ variant: "ghost" })}>
              Iniciar sesión
            </Link>
            <Link href="/sign-up" className={buttonVariants()}>
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-24 text-center">
        <span className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          SaaS multicomercio · pedigo.lat
        </span>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          La plataforma de comida que une{" "}
          <span className="text-orange-600">venta, cocina y delivery</span>
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          POS, inventario, caja, pedidos por WhatsApp y app, tracking en tiempo
          real y facturación electrónica. Todo en un solo lugar, pensado para
          restaurantes y comercios de comida en Colombia.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
            Empezar ahora
          </Link>
          <Link
            href="/sign-in"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            Soy comercio
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-20 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border bg-background p-6 shadow-sm"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1 font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} PediGo · pedigo.lat</span>
          <span>Hecho para comercios de comida 🇨🇴</span>
        </div>
      </footer>
    </main>
  );
}
