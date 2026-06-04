import { FiscalStatusBanner } from "@/components/brand/fiscal-status-banner";
import { PageHeader } from "@/components/brand/page-header";
import { getCommerceDashboard } from "@/modules/commerce/dashboard-queries";
import { listInvoices } from "@/modules/billing/queries";
import { FacturacionClient } from "./facturacion-client";

export const dynamic = "force-dynamic";

export default async function FacturacionPage() {
  const [invoices, dash] = await Promise.all([
    listInvoices(),
    getCommerceDashboard(),
  ]);

  return (
    <div className="pedigo-page">
      <PageHeader
        kicker="DIAN · Colombia"
        title="Facturación electrónica"
        description="Emite, consulta y da trazabilidad a tus documentos fiscales con confianza."
      />
      <FiscalStatusBanner status={dash.fiscalStatus} />
      <FacturacionClient invoices={invoices} />
    </div>
  );
}
