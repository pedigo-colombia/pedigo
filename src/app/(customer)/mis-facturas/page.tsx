import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function MisFacturasPage() {
  return (
    <ModulePlaceholder
      title="Mis facturas"
      phase="Fase 6"
      description="Documentos fiscales asociados a tus compras."
      features={[
        "Listado de facturas",
        "Descarga (PDF/XML futuro)",
        "Detalle fiscal",
        "Estado DIAN",
        "Notas crédito/débito",
        "Buscar por fecha",
      ]}
    />
  );
}
