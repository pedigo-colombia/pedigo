import { listInvoices } from "@/modules/billing/queries";
import { FacturacionClient } from "./facturacion-client";

export const dynamic = "force-dynamic";

export default async function FacturacionPage() {
  const invoices = await listInvoices();
  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">Facturación</h2>
        <p className="text-sm text-muted-foreground">
          Facturas electrónicas, notas crédito/débito y documento soporte. Cada
          documento guarda su foto fiscal y trazabilidad DIAN.
        </p>
      </div>
      <FacturacionClient invoices={invoices} />
    </div>
  );
}
