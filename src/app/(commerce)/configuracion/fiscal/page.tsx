import { getFiscalSequences, getFiscalSettings } from "@/modules/billing/queries";
import { FiscalClient } from "./fiscal-client";

export const dynamic = "force-dynamic";

export default async function ConfiguracionFiscalPage() {
  const [settings, sequences] = await Promise.all([
    getFiscalSettings(),
    getFiscalSequences(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">Configuración fiscal</h2>
        <p className="text-sm text-muted-foreground">
          Identidad fiscal, prefijos y numeración. Entorno DIAN configurable
          (hoy en modo simulado).
        </p>
      </div>
      <FiscalClient settings={settings} sequences={sequences} />
    </div>
  );
}
