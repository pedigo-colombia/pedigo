import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function DireccionesPage() {
  return (
    <ModulePlaceholder
      title="Direcciones"
      phase="Fase 3"
      description="Administra tus direcciones de entrega guardadas."
      features={[
        "Agregar dirección",
        "Marcar predeterminada",
        "Ubicar en el mapa",
        "Editar / eliminar",
        "Notas de entrega",
        "Selección rápida en checkout",
      ]}
    />
  );
}
