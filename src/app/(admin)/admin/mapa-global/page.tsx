import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function AdminMapaGlobalPage() {
  return (
    <ModulePlaceholder
      title="Mapa global"
      phase="Fase 5"
      description="Vista de plataforma: todos los comercios, repartidores y pedidos activos."
      features={[
        "Todos los comercios",
        "Todos los repartidores",
        "Pedidos activos globales",
        "Clustering por densidad",
        "Filtros por ciudad/estado",
        "Tracking en tiempo real",
      ]}
    />
  );
}
