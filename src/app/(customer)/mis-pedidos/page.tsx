import Link from "next/link";

import { getMyOrders } from "@/modules/tracking/queries";
import { formatCOP } from "@/lib/format";
import { STATUS_LABELS } from "@/modules/orders/status";

const statusLabel = (s: string) =>
  (STATUS_LABELS as Record<string, string>)[s] ?? s;
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

const TRACKABLE = ["listo", "en_camino"];

export default async function MisPedidosPage() {
  const orders = await getMyOrders();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Mis pedidos</h2>
      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Todavía no tienes pedidos.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-sm">#{o.id.slice(0, 6)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(o.createdAt).toLocaleDateString("es-CO")}
                  </TableCell>
                  <TableCell>{formatCOP(o.total)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{statusLabel(o.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {TRACKABLE.includes(o.status) && (
                      <Link
                        href={`/track/${o.id}`}
                        className={buttonVariants({ size: "sm" })}
                      >
                        Seguir en vivo
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
