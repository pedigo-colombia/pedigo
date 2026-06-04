import Link from "next/link";
import { Store } from "lucide-react";

import { listActiveCommerces } from "@/modules/orders/catalog-public";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function PedirPage() {
  const commerces = await listActiveCommerces();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pedir</h2>
        <p className="text-sm text-muted-foreground">
          Elige un comercio y arma tu pedido desde la app.
        </p>
      </div>

      {commerces.length === 0 ? (
        <p className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          No hay comercios disponibles en este momento.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {commerces.map((c) => (
            <Link key={c.id} href={`/pedir/${c.slug}`}>
              <Card className="transition-colors hover:border-orange-500">
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-200">
                    <Store className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{c.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Ver menú y hacer pedido
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
