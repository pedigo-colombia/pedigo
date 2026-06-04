import Link from "next/link";
import { MapPin, Receipt, ShoppingBag, Store } from "lucide-react";

import { PageHeader } from "@/components/brand/page-header";
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
      <PageHeader
        kicker="Tu cuenta"
        title={`Hola, ${name}`}
        description="Sigue tus pedidos, facturas y direcciones desde un solo lugar."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {shortcuts.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="transition-colors hover:border-brand-orange/50">
              <CardHeader>
                <s.icon className="h-6 w-6 text-brand-orange" />
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
