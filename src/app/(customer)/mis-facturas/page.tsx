import { getMyInvoices } from "@/modules/customers/queries";
import { formatCOP } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function MisFacturasPage() {
  const invoices = await getMyInvoices();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Mis facturas</h2>
        <p className="text-sm text-muted-foreground">
          Facturas electrónicas de tus pedidos. La descarga PDF/XML estará
          disponible cuando se active el adapter DIAN en producción.
        </p>
      </div>

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>CUFE</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  No tienes facturas asociadas a tus pedidos todavía.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-sm">{inv.fullNumber}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {inv.issuedAt
                      ? new Date(inv.issuedAt).toLocaleDateString("es-CO")
                      : "—"}
                  </TableCell>
                  <TableCell>{formatCOP(inv.total)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{inv.status}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate font-mono text-xs text-muted-foreground">
                    {inv.cufe ?? "—"}
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
