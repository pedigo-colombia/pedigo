import Link from "next/link";
import { MapPin, Receipt, ShoppingBag, Store } from "lucide-react";

import { getSessionWithUser } from "@/modules/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const shortcuts = [
  {
    href: "/pedir",
    title: "Pedir",
    desc: "Explora comercios y haz tu pedido.",
    icon: Store,
  },
  {
    href: "/mis-pedidos",
    title: "Mis pedidos",
    desc: "Historial y seguimiento en vivo.",
    icon: ShoppingBag,
  },
  {
    href: "/mis-facturas",
    title: "Mis facturas",
    desc: "Documentos fiscales de tus compras.",
    icon: Receipt,
  },
  {
    href: "/direcciones",
    title: "Direcciones",
    desc: "Administra tus direcciones de entrega.",
    icon: MapPin,
  },
];

export default async function CuentaPage() {
  const { user } = await getSessionWithUser();
  const name = user?.firstName ?? "👋";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Hola, {name}</h2>
        <p className="text-sm text-muted-foreground">
          Bienvenido a PediGo. Haz seguimiento de tus pedidos en tiempo real.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {shortcuts.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="transition-colors hover:border-orange-500">
              <CardHeader>
                <s.icon className="h-6 w-6 text-orange-600" />
                <CardTitle className="text-base">{s.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {s.desc}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
