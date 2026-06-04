import { getCustomerSummary } from "@/modules/customers/queries";
import { formatCOP } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DataCard,
  DataCardList,
  DataCardRow,
  DataTableDesktop,
} from "@/components/shared/data-card";
import { PageHeader } from "@/components/shared/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const summary = await getCustomerSummary();

  return (
    <div className="pedigo-page">
      <PageHeader
        title="Clientes"
        description="Clientes que han comprado en tu comercio."
      />

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {summary.customers.length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {summary.ordersCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ventas acumuladas
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {formatCOP(summary.totalSpent)}
          </CardContent>
        </Card>
      </div>

      {summary.customers.length === 0 ? (
        <p className="rounded-2xl border border-dashed py-10 text-center text-sm text-muted-foreground">
          Aún no hay clientes registrados con pedidos.
        </p>
      ) : (
        <>
          <DataCardList>
            {summary.customers.map((c) => (
              <DataCard key={c.id}>
                <p className="font-semibold">{c.name ?? "Sin nombre"}</p>
                <DataCardRow label="Email">
                  <span className="break-all">{c.email ?? "—"}</span>
                </DataCardRow>
                <DataCardRow label="Teléfono">{c.phone ?? "—"}</DataCardRow>
              </DataCard>
            ))}
          </DataCardList>

          <DataTableDesktop>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.email ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.phone ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableDesktop>
        </>
      )}
    </div>
  );
}
